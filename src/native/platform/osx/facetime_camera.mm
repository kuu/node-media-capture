#include "facetime_camera.h"
#import "facetime_camera_controller.h"

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

static std::vector<double>& getPossibleAspectRatios() {
  static double array[] = {3.0L / 2.0L, 4.0L / 3.0L, 11.0L / 9.0L, 16.0L / 9.0L};
  static std::vector<double> ratios(array, array + 4);
  return ratios;
}

static double& getDefaultAspectRatio() {
  static double ratio = 4.0L / 3.0L;
  return ratio;
}

static std::vector<double>& getNullVector() {
  static std::vector<double> v(0);
  return v;
}

const std::vector<const Capability*>& FaceTimeCamera::getCapabilities() {
  static const Capability* capabilityList[] = {
    new Capability {
      EConstraintWidth,
      {
        .l = {
          320L, // min
          1280L, // max
          {320L, 352L, 640L, 960L, 1280L}, // values
          960L, // defaultValue
        }
      }
    },
    new Capability {
      EConstraintHeight,
      {
      	.l = {
          240L, // min
          720L, // max
	  {240L, 288L, 480L, 540L, 720L}, // values
          540L, // defaultValue
        }
      }
    },
    new Capability {
      EConstraintAspectRatio,
      {
        .d = {
          0.0, // min
          0.0, // max
          getPossibleAspectRatios(), // values
          getDefaultAspectRatio() // defaultValue
        }
      }
    },
    new Capability {
      EConstraintFrameRate,
      {
        .d = {
          1.0, // min
          30.0, // max
	  getNullVector(), // values
          15.0, // defaultValue
        }
      }
    },
  };

  static const std::vector<const Capability*> capabilities(capabilityList, capabilityList + 4);
  return capabilities;
}

struct Impl {
  FaceTimeCameraController *controller;
};

FaceTimeCamera::FaceTimeCamera(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  ): Camera(deviceId, kind, label, groupId, capabilities), pImpl_(new Impl{nullptr})
{}

FaceTimeCamera::~FaceTimeCamera()
{}

std::vector<std::string>& FaceTimeCamera::GetSupportedCodecs() const {
  static std::string array[] = {"avc"};
  static std::vector<std::string> codecs(array, array + 1);
  return codecs;
}

std::vector<EConstraints>& FaceTimeCamera::GetSupportedConstraints() const {
  static EConstraints array[] = {
    EConstraintWidth,
    EConstraintHeight,
    EConstraintAspectRatio,
    EConstraintFrameRate,
    EConstraintFacingMode,
    EConstraintDeviceId,
    EConstraintGroupId,
  };
  static std::vector<EConstraints> constraints(array, array + 7);
  return constraints;
}

void FaceTimeCamera::InitDevice(const std::vector<const Constraint *>& settings, const std::function<void (const bool)> &callback) const {
  long width = 0, height = 0;
  double aspectRatio = 0.0, frameRate = 0.0;

  // Check the settings
  for (unsigned i = 0; i < settings.size(); i++) {
    switch (settings[i]->key) {
    case EConstraintWidth:
      width = settings[i]->value.l;
      break;
    case EConstraintHeight:
      height = settings[i]->value.l;
      break;
    case EConstraintAspectRatio:
      aspectRatio = settings[i]->value.d;
      break;
    case EConstraintFrameRate:
      frameRate = settings[i]->value.d;
      break;
    default:
      break;
    }
  }

  FaceTimeCameraController *controller = nil;

  controller = [[FaceTimeCameraController alloc]
    initWithDeviceId:
      [NSString stringWithUTF8String: deviceInfo->deviceId.c_str()]
    frameRate: frameRate
    width: width
    height: height
  ];

  ((Impl*)pImpl_)->controller = controller;

  //dispatch_after(0, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
  //dispatch_async(dispatch_get_main_queue(), ^{
    if (controller) {
      callback(false);
    } else {
      callback(true);
    }
  //});
}

void FaceTimeCamera::StartDevice() const {
  [((Impl*)pImpl_)->controller start];
}

void FaceTimeCamera::FetchDevice(void (*callback)(const void * const, size_t, const Metadata**, const size_t)) const {
  return [((Impl*)pImpl_)->controller getFrameData:
    ^(const uint8_t * const data, size_t length,
      const uint8_t * const sps, const size_t spsLength,
      const uint8_t * const pps, const size_t ppsLength,
      const size_t * const samples, const size_t sampleNum) {

      const Sample *sampleArray[sampleNum];
      for (size_t i = 0; i < sampleNum; i++) {
        sampleArray[i] = new Sample{samples[i]};
      }

      const Metadata* metadata[] = {
        new Metadata{EMetadataSPS, spsLength, {.p = sps}},
        new Metadata{EMetadataPPS, ppsLength, {.p = pps}},
        new Metadata{EMetadataSamples, sampleNum, {.arr = std::vector<const Sample*>(sampleArray, sampleArray + sampleNum)}},
      };
      callback(data, length, metadata, 3);
    }
  ];
}
