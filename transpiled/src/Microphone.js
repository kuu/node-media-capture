'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Source2 = require('./Source');

var _Source3 = _interopRequireDefault(_Source2);

var Microphone = (function (_Source) {
  _inherits(Microphone, _Source);

  function Microphone(hal, deviceId, groupId) {
    var capabilities = arguments.length <= 3 || arguments[3] === undefined ? Microphone.DEFAULT_CAPABILITY : arguments[3];

    _classCallCheck(this, Microphone);

    _get(Object.getPrototypeOf(Microphone.prototype), 'constructor', this).call(this, hal, _Source3['default'].TYPE_MICROPHONE, deviceId, groupId, capabilities);
  }

  return Microphone;
})(_Source3['default']);

exports['default'] = Microphone;

Microphone.DEFAULT_CAPABILITY = {
  volume: { min: -1, max: 1, defaultValue: 0 },
  sampleRate: { oneOf: [8000, 22050, 44100, 48000, 96000, 192000], defaultValue: 44100 },
  sampleSize: { oneOf: [8, 12, 16, 24, 32], defaultValue: 16 },
  channelCount: { oneOf: [1, 2, 5.1], defaultValue: 2 },
  echoCancellation: { oneOf: [true, false], defaultValue: false }
};
module.exports = exports['default'];