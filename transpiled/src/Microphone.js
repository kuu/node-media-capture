'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Source2 = require('./Source');

var _Source3 = _interopRequireDefault(_Source2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Microphone = function (_Source) {
  _inherits(Microphone, _Source);

  function Microphone(hal, deviceId, groupId) {
    var capabilities = arguments.length <= 3 || arguments[3] === undefined ? Microphone.DEFAULT_CAPABILITY : arguments[3];

    _classCallCheck(this, Microphone);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Microphone).call(this, hal, _Source3.default.TYPE_MICROPHONE, deviceId, groupId, capabilities));
  }

  return Microphone;
}(_Source3.default);

exports.default = Microphone;


Microphone.DEFAULT_CAPABILITY = {
  volume: { min: -1, max: 1, defaultValue: 0 },
  sampleRate: { oneOf: [8000, 22050, 44100, 48000, 96000, 192000], defaultValue: 44100 },
  sampleSize: { oneOf: [8, 12, 16, 24, 32], defaultValue: 16 },
  channelCount: { oneOf: [1, 2, 5.1], defaultValue: 2 },
  echoCancellation: { oneOf: [true, false], defaultValue: false }
};