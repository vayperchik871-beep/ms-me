#!/bin/bash
# Setup iOS project on macOS
# 1. Install XcodeGen: brew install xcodegen
# 2. Run this script: cd ios && bash setup.sh

cd "$(dirname "$0")"

# Generate Xcode project
xcodegen generate

# Install Pods if using CocoaPods (optional)
# pod install

echo "✅ iOS project generated. Open MsMessenger.xcodeproj in Xcode."
echo ""
echo "Setup in Xcode:"
echo "1. Select your Team in Signing & Capabilities"
echo "2. Select iOS 17+ deployment target"
echo "3. Build and run (Cmd+R)"
