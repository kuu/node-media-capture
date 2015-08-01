import EventTarget from './EventTarget';
import addon from '../../build/Release/addon';

const TEST_MODE = process.env.NODE_ENV !== 'production';
const TIMER_INTERVAL = TEST_MODE ? 100 : 500;

let privateData = new WeakMap();

export default class HAL extends EventTarget {
  constructor() {
    super();
    this.supportedConstraints = addon.getSupportedConstraints();
    privateData.set(this, {
      supportedCodecs: addon.getSupportedCodecs(),
      fetchTimers: {},
      retryTimers: {}
    });
  }

  getAvailableDeviceInfo() {
    if (TEST_MODE) {
      return [
        {
          deviceId: 'abc',
          kind: 'videoinput',
          label: 'Internal Camera',
          groupId: null
        },
        {
          deviceId: 'def',
          kind: 'audioinput',
          label: 'Built-in microphone',
          groupId: null
        }
      ];
    }
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
      if (TEST_MODE) {
        console.log('[SUCCEEDED] HAL.initDevice deviceId=' + deviceId + ', settings=', settings);
        fulfill(true);
        return;
      }
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
      if (!TEST_MODE) {
        addon.startDevice(deviceId);
      }
      let fetchTimers = privateData.get(this).fetchTimers;
      if (fetchTimers[deviceId]) {
        reject(new Error('Device already started.'));
      } else {
        fetchTimers[deviceId] = setInterval(() => {
          if (TEST_MODE) {
            let dummyData = {data: {}, metadata: {sps: {}, pps: {}, samples: [{size: 0}]}};
            callback(dummyData);
            return;
          }
          let buf = addon.fetchDevice(deviceId);
          if (buf) {
            callback(buf);
          }
        }, TIMER_INTERVAL);
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

  takeSnapshot(deviceId) {
    return new Promise((fulfill, reject) => {
      console.log('HAL.takeSnapshot deviceId=' + deviceId);
      if (!TEST_MODE) {
        addon.takeSnapshot(deviceId);
      }
      let retryTimers = privateData.get(this).retryTimers;
      if (retryTimers[deviceId]) {
        reject(new Error('Device currently taking snapshot.'));
      } else {
        retryTimers[deviceId] = setInterval(() => {
          if (TEST_MODE) {
            fulfill(true);
            return;
          }
          let buf = addon.fetchDevice(deviceId);
          if (buf) {
            clearInterval(retryTimers[deviceId]);
            retryTimers[deviceId] = void 0;
            fulfill(buf.data);
          }
        }, 100);
      }
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
