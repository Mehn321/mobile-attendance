const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../node_modules/expo-sqlite');

function findWasmFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log('Directory does not exist:', dirPath);
    return;
  }
  fs.readdirSync(dirPath).forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findWasmFiles(fullPath);
    } else if (file.endsWith('.wasm')) {
      console.log(fullPath);
    }
  });
}

findWasmFiles(dir);
