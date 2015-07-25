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

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

var Source = (function (_EventTarget) {
  _inherits(Source, _EventTarget);

  function Source(hal, sourceType, deviceId, groupId, capabilities) {
    _classCallCheck(this, Source);

    var settings;
    _get(Object.getPrototypeOf(Source.prototype), 'constructor', this).call(this);
    this.hal = hal;
    this.sourceType = sourceType;
    this.deviceId = deviceId;
    this.groupId = groupId;
    this.capabilities = capabilities;
    settings = this.settings = {};
    Object.keys(capabilities).forEach(function (key) {
      settings[key] = capabilities[key].defaultValue;
    });
    this.stopped = true;
    this.refs = new Set();
  }

  _createClass(Source, [{
    key: 'init',
    value: function init() {
      // Initialize hardware
      return this.hal.initDevice(this.deviceId, this.settings);
    }
  }, {
    key: 'reference',
    value: function reference(trackId) {
      var refs = this.refs;
      //console.log('###reference type=' + this.sourceType + ', trackId=' + trackId + ', refs=' + refs.size);
      if (refs.has(trackId)) {
        return this;
      }
      refs.add(trackId);
      if (this.stopped) {
        //console.log('\tstart! trackId=' + trackId);
        this.start();
      }
      return this;
    }
  }, {
    key: 'dereference',
    value: function dereference(trackId) {
      var refs = this.refs;
      //console.log('###dereference type=' + this.sourceType + ', trackId=' + trackId + ', refs=' + refs.size);
      if (!refs.has(trackId)) {
        return this;
      }
      refs['delete'](trackId);
      if (refs.size === 0) {
        //console.log('\tstop! trackId=' + trackId);
        this.stop();
      }
      return this;
    }
  }, {
    key: 'start',
    value: function start() {
      if (!this.stopped) {
        return;
      }
      this.hal.startDevice(this.deviceId, this.onData.bind(this));
      this.stopped = false;
      this.emit('started');
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this.stopped) {
        return;
      }
      this.hal.stopDevice(this.deviceId);
      this.stopped = true;
      this.emit('stopped');
    }
  }, {
    key: 'update',
    value: function update() {
      if (!this.stopped) {
        this.hal.configureDevice(this.deviceId, this.settings);
      }
    }
  }, {
    key: 'onData',
    value: function onData(data) {
      this.emit('data', data);
    }
  }, {
    key: 'getCapabilities',
    value: function getCapabilities() {
      return _Util2['default'].copyObject(this.capabilities);
    }
  }, {
    key: 'getSettings',
    value: function getSettings() {
      return _Util2['default'].copyObject(this.settings);
    }
  }, {
    key: 'mergeSettings',
    value: function mergeSettings(settings) {
      var current = this.settings;
      Object.keys(settings).forEach(function (key) {
        current[key] = settings[key];
      });
    }
  }, {
    key: 'applyConstraints',
    value: function applyConstraints(constraints) {
      var _this = this;

      var pass,
          capabilities = this.capabilities,
          settings = {},
          errorReason = '';

      pass = Object.keys(constraints).every(function (key) {
        var requirement, proposed, result;

        requirement = capabilities[key];
        proposed = constraints[key];
        if (typeof proposed !== 'object') {
          proposed = { exact: proposed };
        }

        if (requirement === void 0) {
          if (_this[key] === void 0) {
            settings[key] = proposed.exact || proposed.ideal || proposed.max || proposed.min || 0;
            return true;
          }
          requirement = _this[key];
        }

        result = Object.keys(proposed).every(function (k) {
          var v = proposed[k],
              checkIfWithinRange = function checkIfWithinRange(value, range) {
            if (typeof range !== 'object') {
              return value === range;
            }
            if (range.oneOf) {
              return range.oneOf.indexOf(value) !== -1;
            }
            if (range.min && range.max) {
              return range.min <= value && range.max >= value;
            }
            return false;
          },
              printError = function printError(prop, data) {
            console.warn('Specified constraints: "' + prop + '"' + data + ' does not match the capability.');
          };

          if (k === 'exact') {
            if (checkIfWithinRange(v, requirement)) {
              settings[key] = v;
              return true;
            }
            printError(key, v);
            return false;
          } else if (k === 'min' || k === 'max') {
            return true;
          } else if (k === 'ideal') {
            if (checkIfWithinRange(v, requirement)) {
              if (settings[key] === void 0) {
                settings[key] = v;
              }
              return true;
            }
            printError(key, v);
            return false;
          } else {
            return false;
          }
        });

        if (result && settings[key] === void 0) {
          settings[key] = requirement.defaultValue;
        }

        if (!result) {
          errorReason = key;
        }
        return result;
      });

      if (pass) {
        this.mergeSettings(settings);
      }
      return [pass, errorReason];
    }
  }, {
    key: 'getZeroInformationContent',
    value: function getZeroInformationContent() {
      return this.hal.getZeroInformationContent(this.deviceId);
    }
  }]);

  return Source;
})(_EventTarget3['default']);

exports['default'] = Source;

Source.TYPE_CAMERA = 'camera';
Source.TYPE_MICROPHONE = 'microphone';
module.exports = exports['default'];