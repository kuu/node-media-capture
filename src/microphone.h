#ifndef MICROPHONE_H
#define MICROPHONE_H

#include "device.h"

class Microphone : public Device {
public:
  Microphone(
    const std::string deviceId,
    const EDeviceKind kind,
    const std::string label,
    const std::string groupId,
    const std::vector<const Capability*> capabilities
  ): Device(deviceId, kind, label, groupId, capabilities)
    {}

  virtual ~Microphone() {};
};

#endif // MICROPHONE_H
