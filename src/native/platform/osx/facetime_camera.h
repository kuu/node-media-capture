#ifndef FACETIME_CAMERA_H
#define FACETIME_CAMERA_H

#include "../../camera.h"

class FaceTimeCamera : public Camera {
private:
  //struct Impl;
  void *pImpl_;

public:
  static const std::vector<const Capability*>& getCapabilities();
  FaceTimeCamera(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  );

  ~FaceTimeCamera();

  std::vector<std::string>& GetSupportedCodecs() const;
  std::vector<EConstraints>& GetSupportedConstraints() const;
  void InitDevice(const std::vector<const Constraint *>& settings, const std::function<void (const bool)> &callback) const;
  void StartDevice() const;
  void FetchDevice(void (*callback)(const void * const, size_t, const Metadata**, const size_t)) const;
};

#endif // FACETIME_CAMERA_H
