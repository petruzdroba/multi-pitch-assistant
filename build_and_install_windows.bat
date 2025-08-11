@echo off
REM Ensure we’re in the project root
cd /d "%~dp0"

REM Check if environment.prod.ts exists, if not create a mock one
if not exist "src\environments\environment.prod.ts" (
  echo ⚠️  src\environments\environment.prod.ts not found. Creating a mock environment file...
  if not exist "src\environments" mkdir src\environments
  (
    echo export const environment = {
    echo   production: true
    echo };
  ) > src\environments\environment.prod.ts
)

REM 1) Build the Ionic web assets
echo 🚧 Building Ionic...
call ionic build
IF ERRORLEVEL 1 (
  echo Ionic build failed!
  pause
  exit /b 1
)

REM 2) Sync Capacitor with Android
echo 🔄 Syncing Capacitor Android...
call npx cap sync android
IF ERRORLEVEL 1 (
  echo Capacitor sync failed!
  pause
  exit /b 1
)

REM 3) Change into the Android project folder
cd android

REM 4) Assemble the debug APK
echo 📦 Assembling Android debug APK...
call gradlew assembleDebug
IF ERRORLEVEL 1 (
  echo Gradle build failed!
  pause
  exit /b 1
)

REM 5) Install (or reinstall) on connected device via ADB
echo 📲 Installing APK on device...
call adb install -r .\app\build\outputs\apk\debug\app-debug.apk
IF ERRORLEVEL 1 (
  echo ADB install failed!
  pause
  exit /b 1
)

@REM REM 6) Push pre-populated database (optional)
@REM if exist "%PREPOP_DB%" (
@REM   echo 📂 Found pre-populated DB at %PREPOP_DB%. Deploying to device...
@REM   REM Push to sdcard temporarily
@REM   call adb push "%PREPOP_DB%" /sdcard/app_db.db
@REM   rem Create app’s databases folder and copy file into it
@REM   call adb shell run-as %PACKAGE_NAME% mkdir -p databases
@REM   call adb shell run-as %PACKAGE_NAME% cp /sdcard/app_db.db databases/app_db.db
@REM   REM Clean up tmp file
@REM   call adb shell rm /sdcard/app_db.db
@REM   echo ✅ Pre-populated DB deployed.
@REM ) else (
@REM   echo ⚠️  No pre-populated DB found at %PREPOP_DB% — skipping database deploy.
@REM )

cd ..
cls
echo ✅ Build & install complete!
pause
