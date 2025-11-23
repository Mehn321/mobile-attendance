const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.wasm');
const destDir = path.resolve(__dirname, '../public/wa-sqlite');
const dest = path.resolve(destDir, 'sqlite.wasm');

if (!fs.existsSync(source)) {
  console.error('Source wasm file does not exist:', source);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(source, dest);
console.log(`Copied wasm file from ${source} to ${dest}`);
