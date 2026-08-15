Pod::Spec.new do |s|
  s.name           = 'SnoozePulseAudio'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # M6 Task 6.1: on-device YAMNet inference (ADR-21, ADR-22).
  # Core ML delegate ships as a subspec of TensorFlowLiteSwift, not a separate pod.
  s.dependency 'TensorFlowLiteSwift', '~> 2.14'
  s.dependency 'TensorFlowLiteSwift/CoreML', '~> 2.14'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  # Tests target XCTest, which auto-links XCUIAutomation on Xcode 16.3+. XCUIAutomation
  # is Simulator-only, so shipping test code in the pod breaks iphoneos device builds.
  s.exclude_files = "Tests/**/*"
  s.resources    = "Resources/**/*"
end
