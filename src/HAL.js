import EventTarget from './EventTarget';
import addon from '../../build/Release/addon';

let privateData = new WeakMap();

export default class HAL extends EventTarget {
  constructor() {
    super();
    this.supportedConstraints = addon.getSupportedConstraints();
    privateData.set(this, {
      supportedCodecs: addon.getSupportedCodecs(),
      fetchTimers: {}
    });
  }

  getAvailableDeviceInfo() {
    let deviceInfo = addon.getAvailableDeviceInfo();
    try {
      deviceInfo.forEach((info) => {
        info.capabilities = JSON.parse(info.capabilities);
      });
    } catch (e) {
      console.warn('HAL.getAvailableDeviceInfo(): Failed to parse capabilities.');
    }
    return deviceInfo;
  }

  initDevice(deviceId, settings) {
    return new Promise((fulfill, reject) => {
      addon.initDevice(deviceId, settings, (e, data) => {
        if (e) {
          console.log('[FAILED] HAL.initDevice deviceId=' + deviceId + ', settings=', settings);
          reject(e);
        } else {
          console.log('[SUCCEEDED] data=' + data + 'HAL.initDevice deviceId=' + deviceId + ', settings=', settings);
          fulfill(data);
        }
      });
    });
  }

  startDevice(deviceId, callback) {
    return new Promise((fulfill, reject) => {
      console.log('HAL.startDevice deviceId=' + deviceId);
      addon.startDevice(deviceId);
      let fetchTimers = privateData.get(this).fetchTimers;
      if (fetchTimers[deviceId]) {
        reject(new Error('Device already started.'));
      } else {
        fetchTimers[deviceId] = setInterval(() => {
          let buf = addon.fetchDevice(deviceId);
          if (buf) {
            callback(buf);
          }
        }, 500);
        fulfill();
      }
    });
  }

  stopDevice(deviceId) {
    return new Promise((fulfill, reject) => {
      console.log('HAL.stopDevice deviceId=' + deviceId);
      let fetchTimers = privateData.get(this).fetchTimers;
      if (fetchTimers[deviceId]) {
        clearInterval(fetchTimers[deviceId]);
        fetchTimers[deviceId] = void 0;
        fulfill();
      } else {
        reject();
      }
    });
  }

  pauseDevice(deviceId) {
    return new Promise((fulfill) => {
      console.log('HAL.pauseDevice deviceId=' + deviceId);
      fulfill();
    });
  }

  resumeDevice(deviceId) {
    return new Promise((fulfill) => {
      console.log('HAL.resumeDevice deviceId=' + deviceId);
      fulfill();
    });
  }

  configureDevice(deviceId, settings) {
    return new Promise((fulfill) => {
      console.log('HAL.configureDevice deviceId=' + deviceId + ', settings=', settings);
      fulfill();
    });
  }

  getZeroInformationContent(deviceId) {
    void deviceId;
    return null;
  }

  get supportedCodecs () {
    return privateData.get(this).supportedCodecs;
  }
}
