/**
 * migrate-images-to-r2.js
 * Downloads images from Supabase Storage (via SDK) and re-uploads to Cloudflare R2,
 * then updates the database posterUrl / backdropUrl for each record.
 *
 * Run: node migrate-images-to-r2.js
 */

// Load .env manually
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ─── Supabase SDK ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

// ─── R2 Config ────────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME || 'rebaflix-videos';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the storage path from a Supabase URL.
 * URL format: .../storage/v1/object/public/media/posters/FILENAME
 * SDK path:   posters/FILENAME  (relative to the bucket)
 */
function extractSupabasePath(url) {
  // Remove everything up to and including /public/{bucket}/
  const match = url.match(/\/object\/(?:public\/)?[^/]+\/(.+)$/);
  return match ? match[1] : null;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.jfif': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif',
  };
  return map[ext] || 'image/jpeg';
}

async function uploadToR2(buffer, key, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.byteLength,
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Downloads from Supabase via SDK and uploads to R2.
 * Returns: new R2 URL | null (already on R2) | undefined (skip/error)
 */
async function migrateUrl(originalUrl, r2Folder, label) {
  if (!originalUrl || !originalUrl.includes('supabase.co')) return null; // already on R2

  const storagePath = extractSupabasePath(originalUrl);
  if (!storagePath) {
    console.error(`    ⚠️  [${label}] Cannot parse Supabase path from: ${originalUrl}`);
    return undefined;
  }

  const filename = path.basename(storagePath);
  console.log(`    ⬇  [${label}] Downloading: ${filename}`);

  try {
    const { data: blob, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(storagePath);

    if (error) {
      console.error(`    ⚠️  [${label}] Supabase error: ${error.message} | status: ${error.status} | name: ${error.name}`);
      console.error(`    ⚠️  Full error:`, JSON.stringify(error));
      return undefined;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = getContentType(filename) || blob.type || 'image/jpeg';
    const key = `${r2Folder}/${crypto.randomUUID()}-${filename}`;
    const newUrl = await uploadToR2(buffer, key, contentType);
    console.log(`    ✅ [${label}] → ${newUrl}`);
    return newUrl;
  } catch (err) {
    console.error(`    ⚠️  [${label}] Skipping (${err.message})`);
    return undefined;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Finding records with Supabase image URLs...\n');

  const [movies, series] = await Promise.all([
    prisma.movie.findMany({
      where: {
        OR: [
          { posterUrl: { contains: 'supabase.co' } },
          { backdropUrl: { contains: 'supabase.co' } },
        ],
      },
      select: { id: true, title: true, posterUrl: true, backdropUrl: true },
    }),
    prisma.series.findMany({
      where: {
        OR: [
          { posterUrl: { contains: 'supabase.co' } },
          { backdropUrl: { contains: 'supabase.co' } },
        ],
      },
      select: { id: true, title: true, posterUrl: true, backdropUrl: true },
    }),
  ]);

  console.log(`Found ${movies.length} movies and ${series.length} series to migrate.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const movie of movies) {
    console.log(`\n📽  Movie: "${movie.title}"`);
    try {
      const newPoster = await migrateUrl(movie.posterUrl, 'posters', 'poster');
      const newBackdrop = await migrateUrl(movie.backdropUrl, 'backdrops', 'backdrop');

      const updateData = {};
      if (newPoster !== undefined) updateData.posterUrl = newPoster;
      if (newBackdrop !== undefined) updateData.backdropUrl = newBackdrop;

      if (Object.keys(updateData).length > 0) {
        await prisma.movie.update({ where: { id: movie.id }, data: updateData });
        console.log(`    💾 DB updated`);
      }
      successCount++;
    } catch (err) {
      console.error(`    ❌ FAILED: ${err.message}`);
      failCount++;
    }
  }

  for (const s of series) {
    console.log(`\n📺  Series: "${s.title}"`);
    try {
      const newPoster = await migrateUrl(s.posterUrl, 'posters', 'poster');
      const newBackdrop = await migrateUrl(s.backdropUrl, 'backdrops', 'backdrop');

      const updateData = {};
      if (newPoster !== undefined) updateData.posterUrl = newPoster;
      if (newBackdrop !== undefined) updateData.backdropUrl = newBackdrop;

      if (Object.keys(updateData).length > 0) {
        await prisma.series.update({ where: { id: s.id }, data: updateData });
        console.log(`    💾 DB updated`);
      }
      successCount++;
    } catch (err) {
      console.error(`    ❌ FAILED: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Done! ${successCount} records processed, ${failCount} hard failures.\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
