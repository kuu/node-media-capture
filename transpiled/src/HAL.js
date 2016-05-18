'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _addon = require('../../build/Release/addon');

var _addon2 = _interopRequireDefault(_addon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TEST_MODE = process.env.NODE_ENV !== 'production';
var TIMER_INTERVAL = TEST_MODE ? 100 : 500;

var privateData = new WeakMap();

var HAL = function (_EventTarget) {
  _inherits(HAL, _EventTarget);

  function HAL() {
    _classCallCheck(this, HAL);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HAL).call(this));

    _this.supportedConstraints = _addon2.default.getSupportedConstraints();
    privateData.set(_this, {
      supportedCodecs: _addon2.default.getSupportedCodecs(),
      fetchTimers: {},
      retryTimers: {}
    });
    return _this;
  }

  _createClass(HAL, [{
    key: 'getAvailableDeviceInfo',
    value: function getAvailableDeviceInfo() {
      if (TEST_MODE) {
        return [{
          deviceId: 'abc',
          kind: 'videoinput',
          label: 'Internal Camera',
          groupId: null
        }, {
          deviceId: 'def',
          kind: 'audioinput',
          label: 'Built-in microphone',
          groupId: null
        }];
      }
      var deviceInfo = _addon2.default.getAvailableDeviceInfo();
      try {
        deviceInfo.forEach(function (info) {
          info.capabilities = JSON.parse(info.capabilities);
        });
      } catch (e) {
        console.warn('HAL.getAvailableDeviceInfo(): Failed to parse capabilities.');
      }
      return deviceInfo;
    }
  }, {
    key: 'initDevice',
    value: function initDevice(deviceId, settings) {
      return new Promise(function (fulfill, reject) {
        if (TEST_MODE) {
          console.log('[SUCCEEDED] HAL.initDevice deviceId=' + deviceId + ', settings=', settings);
          fulfill(true);
          return;
        }
        _addon2.default.initDevice(deviceId, settings, function (e, data) {
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
  }, {
    key: 'startDevice',
    value: function startDevice(deviceId, callback) {
      var _this2 = this;

      return new Promise(function (fulfill, reject) {
        console.log('HAL.startDevice deviceId=' + deviceId);
        if (!TEST_MODE) {
          _addon2.default.startDevice(deviceId);
        }
        var fetchTimers = privateData.get(_this2).fetchTimers;
        if (fetchTimers[deviceId]) {
          reject(new Error('Device already started.'));
        } else {
          fetchTimers[deviceId] = setInterval(function () {
            if (TEST_MODE) {
              var dummyData = { data: {}, metadata: { sps: {}, pps: {}, samples: [{ size: 0 }] } };
              callback(dummyData);
              return;
            }
            var buf = _addon2.default.fetchDevice(deviceId);
            if (buf) {
              callback(buf);
            }
          }, TIMER_INTERVAL);
          fulfill();
        }
      });
    }
  }, {
    key: 'stopDevice',
    value: function stopDevice(deviceId) {
      var _this3 = this;

      return new Promise(function (fulfill, reject) {
        console.log('HAL.stopDevice deviceId=' + deviceId);
        var fetchTimers = privateData.get(_this3).fetchTimers;
        if (fetchTimers[deviceId]) {
          clearInterval(fetchTimers[deviceId]);
          fetchTimers[deviceId] = void 0;
          fulfill();
        } else {
          reject();
        }
      });
    }
  }, {
    key: 'pauseDevice',
    value: function pauseDevice(deviceId) {
      return new Promise(function (fulfill) {
        console.log('HAL.pauseDevice deviceId=' + deviceId);
        fulfill();
      });
    }
  }, {
    key: 'resumeDevice',
    value: function resumeDevice(deviceId) {
      return new Promise(function (fulfill) {
        console.log('HAL.resumeDevice deviceId=' + deviceId);
        fulfill();
      });
    }
  }, {
    key: 'configureDevice',
    value: function configureDevice(deviceId, settings) {
      return new Promise(function (fulfill) {
        console.log('HAL.configureDevice deviceId=' + deviceId + ', settings=', settings);
        fulfill();
      });
    }
  }, {
    key: 'takeSnapshot',
    value: function takeSnapshot(deviceId) {
      var _this4 = this;

      return new Promise(function (fulfill, reject) {
        console.log('HAL.takeSnapshot deviceId=' + deviceId);
        if (!TEST_MODE) {
          _addon2.default.takeSnapshot(deviceId);
        }
        var retryTimers = privateData.get(_this4).retryTimers;
        if (retryTimers[deviceId]) {
          reject(new Error('Device currently taking snapshot.'));
        } else {
          retryTimers[deviceId] = setInterval(function () {
            if (TEST_MODE) {
              fulfill(true);
              return;
            }
            var buf = _addon2.default.fetchDevice(deviceId);
            if (buf) {
              clearInterval(retryTimers[deviceId]);
              retryTimers[deviceId] = void 0;
              fulfill(buf.data);
            }
          }, 100);
        }
      });
    }
  }, {
    key: 'getZeroInformationContent',
    value: function getZeroInformationContent(deviceId) {
      void deviceId;
      return null;
    }
  }, {
    key: 'supportedCodecs',
    get: function get() {
      return privateData.get(this).supportedCodecs;
    }
  }]);

  return HAL;
}(_EventTarget3.default);

exports.default = HAL;