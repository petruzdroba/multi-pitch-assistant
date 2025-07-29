#!/bin/bash
set -e

# Ensure we're in the project root
cd "$(dirname "$0")"

# Check and create mock environment.prod.ts if missing
ENV_PATH="./src/environments/environment.prod.ts"
if [ ! -f "$ENV_PATH" ]; then
  echo "⚠️  $ENV_PATH not found. Creating a mock environment file..."
  mkdir -p ./src/environments
  cat <<EOL > "$ENV_PATH"
export const environment = {
  production: true
};
EOL
fi

# 1) Build the Ionic web assets
echo "🚧 Building Ionic..."
if ! ionic build; then
  echo "❌ Ionic build failed!"
  exit 1
fi

# 2) Sync Capacitor with Android
echo "🔄 Syncing Capacitor Android..."
if ! npx cap sync android; then
  echo "❌ Capacitor sync failed!"
  exit 1
fi

# 3) Change into the Android project folder
cd android || exit 1

# 4) Assemble the debug APK
chmod +x gradlew
echo "📦 Assembling Android debug APK..."
if ! ./gradlew assembleDebug; then
  echo "❌ Gradle build failed!"
  exit 1
fi
cd ..


# 5) Install APK on connected device via ADB
echo "📲 Uninstalling existing app if any..."
adb uninstall io.ionic.starter || true

echo "📲 Installing APK on device..."
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if ! adb install -r "$APK_PATH"; then
  echo "❌ ADB install failed!"
  exit 1
fi


cd ..

echo "✅ Build & install complete!"
