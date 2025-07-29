# React Native Build Script with Warning Suppression
# This script runs the React Native build process while suppressing non-critical IDE warnings

Write-Host "🚀 Starting React Native build with warning suppression..." -ForegroundColor Green

# Set environment variables to suppress warnings
$env:GRADLE_OPTS = "-Dorg.gradle.warning.mode=none -Dorg.gradle.logging.level=ERROR"
$env:JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"

try {
    Write-Host "📱 Building React Native Android app..." -ForegroundColor Cyan
    
    # Clean build first
    npx react-native run-android --variant=debug 2>&1 | Where-Object { 
        $_ -notmatch "Missing Gradle project configuration folder" -and
        $_ -notmatch "\.settings" -and
        $_ -notmatch "Invalid Gradle project configuration"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during build: $_" -ForegroundColor Red
}

Write-Host "🏁 Build process finished." -ForegroundColor Yellow
