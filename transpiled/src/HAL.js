'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _buildReleaseAddon = require('../../build/Release/addon');

var _buildReleaseAddon2 = _interopRequireDefault(_buildReleaseAddon);

var privateData = new WeakMap();

var HAL = (function (_EventTarget) {
  _inherits(HAL, _EventTarget);

  function HAL() {
    _classCallCheck(this, HAL);

    _get(Object.getPrototypeOf(HAL.prototype), 'constructor', this).call(this);
    this.supportedConstraints = _buildReleaseAddon2['default'].getSupportedConstraints();
    privateData.set(this, {
      supportedCodecs: _buildReleaseAddon2['default'].getSupportedCodecs(),
      fetchTimers: {}
    });
  }

  _createClass(HAL, [{
    key: 'getAvailableDeviceInfo',
    value: function getAvailableDeviceInfo() {
      var deviceInfo = _buildReleaseAddon2['default'].getAvailableDeviceInfo();
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
        _buildReleaseAddon2['default'].initDevice(deviceId, settings, function (e, data) {
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
      var _this = this;

      return new Promise(function (fulfill, reject) {
        console.log('HAL.startDevice deviceId=' + deviceId);
        _buildReleaseAddon2['default'].startDevice(deviceId);
        var fetchTimers = privateData.get(_this).fetchTimers;
        if (fetchTimers[deviceId]) {
          reject(new Error('Device already started.'));
        } else {
          fetchTimers[deviceId] = setInterval(function () {
            var buf = _buildReleaseAddon2['default'].fetchDevice(deviceId);
            if (buf) {
              callback(buf);
            }
          }, 500);
          fulfill();
        }
      });
    }
  }, {
    key: 'stopDevice',
    value: function stopDevice(deviceId) {
      var _this2 = this;

      return new Promise(function (fulfill, reject) {
        console.log('HAL.stopDevice deviceId=' + deviceId);
        var fetchTimers = privateData.get(_this2).fetchTimers;
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
})(_EventTarget3['default']);

exports['default'] = HAL;
module.exports = exports['default'];