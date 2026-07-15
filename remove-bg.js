const sharp = require('sharp');

async function processImage(inputPath, outputPath) {
  try {
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Assuming top-left pixel is the background color
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Distance from background color
      const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
      
      // If it's very close to the background color, make it transparent
      if (dist < 50) { 
        data[i + 3] = 0; // Set alpha to 0
      }
    }

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log("Saved " + outputPath);
  } catch (err) {
    console.error("Error processing " + inputPath + ":", err);
  }
}

async function run() {
  await processImage('logo reba.png', 'public/logo1.png');
  await processImage('logo reba 2.png', 'public/logo2.png');
}

run();
