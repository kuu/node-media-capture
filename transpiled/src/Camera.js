'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Source2 = require('./Source');

var _Source3 = _interopRequireDefault(_Source2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Camera = function (_Source) {
  _inherits(Camera, _Source);

  function Camera(hal, deviceId, groupId) {
    var capabilities = arguments.length <= 3 || arguments[3] === undefined ? Camera.DEFAULT_CAPABILITY : arguments[3];

    _classCallCheck(this, Camera);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Camera).call(this, hal, _Source3.default.TYPE_CAMERA, deviceId, groupId, capabilities));
  }

  _createClass(Camera, [{
    key: 'mergeSettings',
    value: function mergeSettings(settings) {
      var aspectRatio, width, height, currentSettings;

      _get(Object.getPrototypeOf(Camera.prototype), 'mergeSettings', this).call(this, settings);

      // Check aspectRatio
      currentSettings = this.settings;
      aspectRatio = currentSettings.aspectRatio;
      width = currentSettings.width;
      height = currentSettings.height;
      if (width / height !== aspectRatio) {
        if (settings.aspectRatio !== void 0) {
          // Use the newly specified aspectRatio
          if (settings.width !== void 0) {
            currentSettings.height = Math.round(width / aspectRatio);
          } else {
            currentSettings.width = Math.round(height * aspectRatio);
          }
        } else if (settings.width !== void 0) {
          // Use the newly specified width
          currentSettings.height = Math.round(width / aspectRatio);
        } else {
          // Use the newly specified height
          currentSettings.width = Math.round(height * aspectRatio);
        }
      }
    }
  }]);

  return Camera;
}(_Source3.default);

exports.default = Camera;


Camera.FACING_MODE_USER = 'user';
Camera.FACING_MODE_ENVIRONMENT = 'environment';
Camera.FACING_MODE_LEFT = 'left';
Camera.FACING_MODE_RIGHT = 'right';

Camera.DEFAULT_CAPABILITY = {
  width: { min: 320, max: 1920, defaultValue: 640 },
  height: { min: 240, max: 1080, defaultValue: 360 },
  frameRate: { min: 1, max: 120, defaultValue: 15 },
  aspectRatio: { oneOf: [3 / 2, 4 / 3, 16 / 9], defaultValue: 16 / 9 },
  facingMode: {
    oneOf: [Camera.FACING_MODE_USER, Camera.FACING_MODE_ENVIRONMENT, Camera.FACING_MODE_LEFT, Camera.FACING_MODE_RIGHT],
    defaultValue: Camera.FACING_MODE_USER
  }
};