#include "../../device_manager.h"
#include "facetime_camera.h"
#include "builtin_microphone.h"

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

static const std::vector<const Device*>& getMacDevices() {

  static std::vector<const Device*> availableDevices;

  NSArray *devices = [AVCaptureDevice devices];

  for (AVCaptureDevice *device in devices) {

    unsigned i = 0;

    for (; i < availableDevices.size(); i++) {
      NSString *prevId = [NSString stringWithUTF8String: availableDevices[i]->GetDeviceInfo()->deviceId.c_str()];
      NSString *currId = [device uniqueID];
      if([prevId compare:currId] == NSOrderedSame) {
        break;
      }
    }

    if (i < availableDevices.size()) {
      continue;
    }

    if ([device hasMediaType:AVMediaTypeVideo]) {
      availableDevices.push_back(new FaceTimeCamera([[device uniqueID] UTF8String], EDeviceKindVideoInput, [[device localizedName] UTF8String], "", FaceTimeCamera::getCapabilities()));
    }

    if ([device hasMediaType:AVMediaTypeAudio]) {
      availableDevices.push_back(new BuiltinMicrophone([[device uniqueID] UTF8String], EDeviceKindAudioInput, [[device localizedName] UTF8String], "", BuiltinMicrophone::getCapabilities()));
    }
  }

  return availableDevices;
}

DeviceManager::DeviceManager() {}

const std::vector<const Device*>& DeviceManager::getDevices() const {
  return getMacDevices();
}

const Device *DeviceManager::getDevice(const std::string deviceId) const {
  const std::vector<const Device*>& devices = getMacDevices();

  for (unsigned i = 0; i < devices.size(); i++) {
    if (devices[i]->GetDeviceInfo()->deviceId == deviceId) {
      return devices[i];
    }
  }
  return nullptr;
}
