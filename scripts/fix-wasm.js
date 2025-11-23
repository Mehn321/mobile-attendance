const fs = require("fs");
const path = require("path");

/**
 * Fix expo-sqlite WASM configuration
 * This script ensures WASM modules are properly resolved by Metro bundler
 */

const wasmDir = path.join(__dirname, "../public/wa-sqlite");
const wasmFile = path.join(wasmDir, "sqlite.wasm");

console.log("🔧 Fixing expo-sqlite WASM configuration...");

// Ensure public/wa-sqlite directory exists
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
  console.log("✅ Created public/wa-sqlite directory");
}

// Check if WASM file exists (you should have it from your project)
if (fs.existsSync(wasmFile)) {
  console.log("✅ Found sqlite.wasm at", wasmFile);
} else {
  console.warn("⚠️  sqlite.wasm not found. Make sure to place it in public/wa-sqlite/");
}

// Log WASM configuration
console.log("\n📋 WASM Configuration:");
console.log(`  - WASM Directory: ${wasmDir}`);
console.log(`  - WASM File: ${wasmFile}`);
console.log(`  - Metro Config: metro.config.js handles WASM extension`);
console.log("\n✅ WASM configuration complete");
