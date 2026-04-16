// Run with: node generate-icon.js
// Generates a 1024x1024 app icon for Drift

const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background gradient (dark purple)
const bg = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size*0.7);
bg.addColorStop(0, '#1a0f2e');
bg.addColorStop(0.5, '#120a20');
bg.addColorStop(1, '#0a0612');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, size, size);

// Subtle floating circles (dream bubbles)
ctx.globalAlpha = 0.04;
ctx.fillStyle = '#c4b5fd';
for (let i = 0; i < 8; i++) {
  const x = 200 + Math.sin(i * 1.3) * 300;
  const y = 200 + Math.cos(i * 0.9) * 300;
  const r = 80 + i * 30;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
ctx.globalAlpha = 1;

// Main glowing orb (the player character)
const orbX = size/2, orbY = size/2 - 20;

// Outer glow
const glow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 200);
glow.addColorStop(0, 'rgba(196, 181, 253, 0.3)');
glow.addColorStop(0.5, 'rgba(196, 181, 253, 0.1)');
glow.addColorStop(1, 'transparent');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, size, size);

// Light trail (behind the orb)
ctx.globalAlpha = 0.4;
for (let i = 0; i < 5; i++) {
  const trailY = orbY + 40 + i * 30;
  const trailSize = 30 - i * 4;
  const trailAlpha = 0.6 - i * 0.12;
  ctx.globalAlpha = trailAlpha;
  ctx.fillStyle = '#c4b5fd';
  ctx.beginPath();
  ctx.arc(orbX - i * 8, trailY, trailSize, 0, Math.PI * 2);
  ctx.fill();
}
ctx.globalAlpha = 1;

// Main orb body
ctx.fillStyle = '#c4b5fd';
ctx.beginPath();
ctx.ellipse(orbX, orbY, 55, 70, 0, 0, Math.PI * 2);
ctx.fill();

// Inner bright core
ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
ctx.beginPath();
ctx.ellipse(orbX, orbY - 15, 30, 35, 0, 0, Math.PI * 2);
ctx.fill();

// Eye
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.beginPath();
ctx.arc(orbX + 15, orbY - 15, 10, 0, Math.PI * 2);
ctx.fill();

// Title text "DRIFT"
ctx.fillStyle = '#c4b5fd';
ctx.font = 'bold 120px monospace';
ctx.textAlign = 'center';
ctx.shadowColor = 'rgba(180, 160, 255, 0.5)';
ctx.shadowBlur = 30;
ctx.fillText('DRIFT', size/2, size - 180);
ctx.shadowBlur = 0;

// Tagline
ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ctx.font = '36px monospace';
ctx.fillText('💭', size/2, size - 120);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/icon-1024.png', buffer);
console.log('Icon saved to assets/icon-1024.png');
