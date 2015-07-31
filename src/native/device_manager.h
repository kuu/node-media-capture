#ifndef DEVICE_MANAGER_H
#define DEVICE_MANAGER_H

#include <vector>
#include <string>
#include "device.h"

class DeviceManager {
private:
  DeviceManager();

public:
  static const DeviceManager * getInstance() {
    static const DeviceManager * const instance = new DeviceManager();
    return instance;
  }

  /**
   * @return
   *   An array of Device objects.
   */
  const std::vector<const Device*>& getDevices() const;

  /**
   * @return
   *   A Device object.
   */
  const Device *getDevice(const std::string deviceId) const;
};

#endif // DEVICE_MANAGER_H
