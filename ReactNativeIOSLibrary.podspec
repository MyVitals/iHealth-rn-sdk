require "json"
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "ReactNativeIOSLibrary"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platform     = :ios, "12.0"
  s.ios.deployment_target = '12.0'
  s.static_framework = true
  s.source       = { :git => "https://github.com/iHealthLab/iHealth-rn-sdk.git", :tag => "v#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.public_header_files = "ios/ReactNativeIOSLibrary/Communication_SDK/Headers/*.h"
  s.vendored_libraries  = "ios/ReactNativeIOSLibrary/Communication_SDK/libiHealthSDK2.15.0.a"
  s.requires_arc = true

  # The vendored .a library is compiled for iOS device only (not simulator).
  # Exclude arm64 for simulator targets so the build succeeds.
  s.pod_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }

  s.dependency 'React-Core'
end
