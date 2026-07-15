const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBucket() {
  const { data, error } = await supabase.storage.getBucket('media')
  
  if (error) {
    console.error('Bucket error:', error)
    if (error.message.includes('not found')) {
      console.log('Creating bucket...')
      const { data: createData, error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
        fileSizeLimit: 104857600 // 100MB
      })
      console.log('Create Result:', createData, createError)
    }
  } else {
    console.log('Bucket exists:', data)
  }
}

checkBucket()
