#include "builtin_microphone.h"

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

static std::vector<long>& getPossibleSampleRate() {
  static long array[] = {8000, 22050, 44100, 48000, 96000, 192000};
  static std::vector<long> rates(array, array + 6);
  return rates;
}

static std::vector<long>& getPossibleSampleSize() {
  static long array[] = {8, 12, 16, 24, 32};
  static std::vector<long> sizes(array, array + 5);
  return sizes;
}

static std::vector<double>& getPossibleChannelCount() {
  static double array[] = {1.0, 2.0, 5.1};
  static std::vector<double> counts(array, array + 3);
  return counts;
}

static std::vector<double>& getNullVector() {
  static std::vector<double> v(0);
  return v;
}

static std::vector<bool>& getTrueFalse() {
  static bool array[] = {true, false};
  static std::vector<bool> tf(array, array + 2);
  return tf;
}

const std::vector<const Capability*>& BuiltinMicrophone::getCapabilities() {
  static const Capability* capabilityList[] = {
    new Capability {
      EConstraintVolume,
      {
      	.d = {
          -1.0, // min
          1.0, // max
	  getNullVector(), // values
          0.0, // defaultValue
        }
      }
    },
    new Capability {
      EConstraintSampleRate,
      {
        .l = {
          0L, // min
          0L, // max
	  getPossibleSampleRate(), // values
          44100L, // defaultValue
        }
      }
    },
    new Capability {
      EConstraintSampleSize,
      {
        .l = {
          0L, // min
          0L, // max
	  getPossibleSampleSize(), // values
          16L, // defaultValue
        }
      }
    },
    new Capability {
      EConstraintChannelCount,
      {
        .d = {
          0.0, // min
          0.0, // max
          getPossibleChannelCount(), // values
          2.0 // defaultValue
        }
      }
    },
    new Capability {
      EConstraintEchoCancellation,
      {
        .b = {
          false, // min
          false, // max
	  getTrueFalse(), // values
          false, // defaultValue
        }
      }
    },
  };

  static const std::vector<const Capability*> capabilities(capabilityList, capabilityList + 5);
  return capabilities;
}

//struct BuiltinMicrophone::Impl {
//    NSString *str;
//};


BuiltinMicrophone::BuiltinMicrophone(
  const std::string deviceId,
  const EDeviceKind kind,
  const std::string label,
  const std::string groupId,
  const std::vector<const Capability*> capabilities
): Microphone(deviceId, kind, label, groupId, capabilities)
{
    //((Impl*)pImpl_)->str = [[NSString alloc] init];
}

BuiltinMicrophone::~BuiltinMicrophone()
{
    //[((Impl*)pImpl_)->str release];
}

std::vector<std::string>& BuiltinMicrophone::GetSupportedCodecs() const {
  static std::string array[] = {"aac"};
  static std::vector<std::string> codecs(array, array + 1);
  return codecs;
}

std::vector<EConstraints>& BuiltinMicrophone::GetSupportedConstraints() const {
  static EConstraints array[] = {
    EConstraintVolume,
    EConstraintSampleRate,
    EConstraintSampleSize,
    EConstraintChannelCount,
    EConstraintEchoCancellation,
    EConstraintDeviceId,
    EConstraintGroupId,
  };
  static std::vector<EConstraints> constraints(array, array + 7);
  return constraints;
}

void BuiltinMicrophone::InitDevice(const std::vector<const Constraint *>& settings, const std::function<void (const bool)> &callback) const {
  //std::cout << "!!!!BuiltinMicrophone::InitDevice" << std::endl;
  callback(false);
}

void BuiltinMicrophone::StartDevice() const {
}

void BuiltinMicrophone::TakeSnapshot() const {
}

void BuiltinMicrophone::FetchDevice(void (*callback)(const void * const, size_t, const Metadata**, const size_t)) const {
}
