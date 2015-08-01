{
  "targets": [
  ],
  'conditions': [
    [
      'OS=="mac"', {
        'targets': [
          {
            'target_name': 'addon',
            'defines': [
            ],
            'sources': [
              './src/native/binding.cc',
              './src/native/platform/osx/device_manager.mm',
              './src/native/platform/osx/facetime_camera.mm',
              './src/native/platform/osx/facetime_camera_controller.mm',
              './src/native/platform/osx/h264_encoder.mm',
              './src/native/platform/osx/builtin_microphone.mm'
            ],
            'include_dirs': [
              '/usr/local/include',
              "<!(node -e \"require('nan')\")"
            ],
            'cflags': [
            ],
            'dependencies': [
            ],
            'ldflags': [
            ],
            'mac_bundle_resources': [
            ],
            'link_settings': {
              'libraries': [
                '/System/Library/Frameworks/Foundation.framework',
                '/System/Library/Frameworks/AVFoundation.framework',
                '/System/Library/Frameworks/CoreVideo.framework',
                '/System/Library/Frameworks/CoreMedia.framework',
              ],
            },
            'xcode_settings': {
              'OTHER_CPLUSPLUSFLAGS' : ['-std=c++11','-stdlib=libc++', '-v'],
              'OTHER_LDFLAGS': ['-stdlib=libc++'],
              'MACOSX_DEPLOYMENT_TARGET': '10.7',
            },
          },
        ],
      }
    ],
    [
      'OS=="windows"', {
      }
    ],
    [
      'OS=="linux"', {
      }
    ]
  ]
}
