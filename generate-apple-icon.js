/**
 * Generate apple-touch-icon.png with proper square format
 * This maintains the logo aspect ratio and centers it in a square 180x180 icon
 * 
 * The logo-monogram.svg has a 41x60 aspect ratio (portrait).
 * We need to convert it to 180x180 (square) with proper scaling and padding.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAppleTouchIcon() {
  try {
    const svgPath = path.join(__dirname, 'assets/logo/logo-monogram.svg');
    let svgContent = fs.readFileSync(svgPath, 'utf8');

    // Replace currentColor with black for proper rendering
    svgContent = svgContent.replace(/fill="currentColor"/g, 'fill="black"');

    // Create a wrapper SVG that maintains aspect ratio with padding
    // The logo is 41x60, so we scale it to 120x180 (maintaining ratio) 
    // and center it in a 180x180 canvas with white background
    const wrappedSvg = `
      <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" fill="white"/>
        <g transform="translate(30, 0)">
          ${svgContent.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </g>
      </svg>
    `;

    const iconBuffer = await sharp(Buffer.from(wrappedSvg))
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    const outputPath = path.join(__dirname, 'public/apple-touch-icon.png');
    fs.writeFileSync(outputPath, iconBuffer);

    console.log('✅ apple-touch-icon.png generated successfully!');
    console.log(`📍 Saved to: ${outputPath}`);
    console.log(`📊 Size: ${(iconBuffer.length / 1024).toFixed(2)} KB`);
    console.log('✨ Icon now has proper square format (180x180) for iOS Safari bookmarks');
  } catch (error) {
    console.error('❌ Error generating apple-touch-icon.png:', error);
    process.exit(1);
  }
}

generateAppleTouchIcon();
