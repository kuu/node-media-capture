#ifndef DEVICE_H
#define DEVICE_H

#include <string>
#include <iostream>
#include <vector>
#include <functional>

const std::string CONSTRAINTS_STRING[] = {
    "width",
    "height",
    "aspectRatio",
    "frameRate",
    "facingMode",
    "volume",
    "sampleRate",
    "sampleSize",
    "channelCount",
    "echoCancellation",
    "deviceId",
    "groupId"
};


enum EConstraints {
  EConstraintWidth,
  EConstraintHeight,
  EConstraintAspectRatio,
  EConstraintFrameRate,
  EConstraintFacingMode,
  EConstraintVolume,
  EConstraintSampleRate,
  EConstraintSampleSize,
  EConstraintChannelCount,
  EConstraintEchoCancellation,
  EConstraintDeviceId,
  EConstraintGroupId,
};

const std::string DEVICE_KIND_STRING[] = {
  "audioinput",
  "audiooutput",
  "videoinput"
};

enum EDeviceKind {
  EDeviceKindAudioInput,
  EDeviceKindAudioOutput,
  EDeviceKindVideoInput,
};

template <typename T>
struct CapabilityValue {
  T min;
  T max;
  std::vector<T> values;
  T defaultValue;
};

struct Capability {
  EConstraints key;
  union CapabilityTypedValue {
    struct CapabilityValue<double> d;
    struct CapabilityValue<long> l;
    struct CapabilityValue<bool> b;
    struct CapabilityValue<std::string> s;
  } value;
};

struct Constraint {
  EConstraints key;
  union ConstraintTypedValue {
    double d;
    long l;
    bool b;
    std::string s;
  } value;
};

struct MediaDeviceInfo {
  const std::string deviceId;
  const EDeviceKind kind;
  const std::string label;
  const std::string groupId;
  const std::vector<const Capability*> capabilities;
};

enum EMetadataKey {
  EMetadataSPS,
  EMetadataPPS,
  EMetadataSamples,
};

struct Sample {
  const size_t size;
};

struct Metadata {
  const EMetadataKey key;
  const size_t size;
  union MetadataValue {
    const long l;
    const bool b;
    const char *s;
    const uint8_t *p;
    const std::vector<const Sample*> arr;
  } value;
};

class Device {
protected:
  const MediaDeviceInfo *deviceInfo;

public:

  Device(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  ):
  deviceInfo(new MediaDeviceInfo{deviceId, kind, label, groupId, capabilities})
  {};

  virtual ~Device() {};

  /**
   * @return
   *   An array of supported codecs.
   */
  virtual std::vector<std::string>& GetSupportedCodecs() const = 0;

  /**
   * @return
   *   An array of supported constraints.
   */
  virtual std::vector<EConstraints>& GetSupportedConstraints() const = 0;

  /**
   * @return
   *   A MediaDeviceInfo object.
   */
  const MediaDeviceInfo *GetDeviceInfo() const {
    return deviceInfo;
  }

  virtual void InitDevice(const std::vector<const Constraint *>& settings, const std::function<void (const bool)> &callback) const = 0;

  virtual void StartDevice() const = 0;

  virtual void TakeSnapshot() const = 0;

  virtual void FetchDevice(void (*callback)(const void * const, size_t, const Metadata**, const size_t)) const = 0;
};

#endif // DEVICE_H
