#ifndef CAMERA_H
#define CAMERA_H

#include "device.h"

class Camera : public Device {
public:
  Camera(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  ): Device(deviceId, kind, label, groupId, capabilities)
    {}

  virtual ~Camera() {};
};

#endif // CAMERA_H
