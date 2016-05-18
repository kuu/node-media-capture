'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Source = function (_EventTarget) {
  _inherits(Source, _EventTarget);

  function Source(hal, sourceType, deviceId, groupId, capabilities) {
    _classCallCheck(this, Source);

    var settings;

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Source).call(this));

    _this.hal = hal;
    _this.sourceType = sourceType;
    _this.deviceId = deviceId;
    _this.groupId = groupId;
    _this.capabilities = capabilities;
    settings = _this.settings = {};
    Object.keys(capabilities).forEach(function (key) {
      settings[key] = capabilities[key].defaultValue;
    });
    _this.stopped = true;
    _this.refs = new Set();
    return _this;
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
      refs.delete(trackId);
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
      return _Util2.default.copyObject(this.capabilities);
    }
  }, {
    key: 'getSettings',
    value: function getSettings() {
      return _Util2.default.copyObject(this.settings);
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
      var _this2 = this;

      var pass,
          capabilities = this.capabilities,
          settings = {},
          errorReason = '';

      pass = Object.keys(constraints).every(function (key) {
        var requirement, proposed, result;

        requirement = capabilities[key];
        proposed = constraints[key];
        if ((typeof proposed === 'undefined' ? 'undefined' : _typeof(proposed)) !== 'object') {
          proposed = { exact: proposed };
        }

        if (requirement === void 0) {
          if (_this2[key] === void 0) {
            settings[key] = proposed.exact || proposed.ideal || proposed.max || proposed.min || 0;
            return true;
          }
          requirement = _this2[key];
        }

        result = Object.keys(proposed).every(function (k) {
          var v = proposed[k],
              checkIfWithinRange = function checkIfWithinRange(value, range) {
            if ((typeof range === 'undefined' ? 'undefined' : _typeof(range)) !== 'object') {
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
}(_EventTarget3.default);

exports.default = Source;


Source.TYPE_CAMERA = 'camera';
Source.TYPE_MICROPHONE = 'microphone';