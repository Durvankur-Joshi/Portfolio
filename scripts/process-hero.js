import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = 'C:\\Users\\joshi\\.gemini\\antigravity-ide\\brain\\87558c2e-215c-40f2-b0d7-a77f9cb71020\\spider_hero_sketch_1787578949920.jpg';
const outputWebp = path.resolve('public/textures/corridor/spider_hero.webp');
const outputPng = path.resolve('public/textures/corridor/spider_hero.png');

async function processImage() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Make near-white pixels transparent, preserving pencil lines
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness
    const brightness = (r + g + b) / 3;
    
    if (brightness > 240) {
      // Fully white -> completely transparent
      data[i + 3] = 0;
    } else if (brightness > 180) {
      // Soft antialiased blend
      const factor = (240 - brightness) / 60;
      data[i + 3] = Math.round(255 * factor);
    } else {
      // Ink line / pencil sketch -> solid
      data[i + 3] = 255;
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(outputWebp);

  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .png()
  .toFile(outputPng);

  console.log('Spider hero texture generated successfully at:', outputWebp);
}

processImage().catch(console.error);
