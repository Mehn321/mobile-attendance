#!/bin/bash
set -e

echo "Step 1: Create wasm directory"
mkdir -p public/wa-sqlite

echo "Step 2: Copy sqlite.wasm file"
cp node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.wasm public/wa-sqlite/sqlite.wasm

echo "Step 3: Inject wasm enable config into app.json"
if [ -f app.json ]; then
  jq '.expo.web.bundler = "metro" | .expo.web.wasm = true' app.json > app.tmp.json
  mv app.tmp.json app.json
else
  echo '{
    "expo": {
      "web": {
        "bundler": "metro",
        "wasm": true
      }
    }
  }' > app.json
fi

echo "Step 4: Create tabs folder and move screens"
mkdir -p app/\(tabs\)

mv app/index.tsx app/\(tabs\)/index.tsx
mv app/explore.tsx app/\(tabs\)/explore.tsx
mv app/settings.tsx app/\(tabs\)/settings.tsx

echo "Step 5: Replace _layout.tsx with tabs layout"
cat > app/_layout.tsx <<'EOF'
// app/_layout.tsx
import { Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
EOF

echo "Step 6: Remove old screen files (if still present)"
rm -f app/index.tsx app/explore.tsx app/settings.tsx

echo "Step 7: Remove node_modules and package-lock.json"
rm -rf node_modules package-lock.json

echo "Step 8: Reinstall dependencies"
npm install

echo "Step 9: Done. Please run 'npx expo start' to start the app."
