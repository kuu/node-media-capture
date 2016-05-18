'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _MediaStream = require('./MediaStream');

var _MediaStream2 = _interopRequireDefault(_MediaStream);

var _MediaStreamTrack = require('./MediaStreamTrack');

var _MediaStreamTrack2 = _interopRequireDefault(_MediaStreamTrack);

var _MediaStreamError = require('./MediaStreamError');

var _MediaStreamError2 = _interopRequireDefault(_MediaStreamError);

var _SourceManager = require('./SourceManager');

var _SourceManager2 = _interopRequireDefault(_SourceManager);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MediaDevices = function (_EventTarget) {
  _inherits(MediaDevices, _EventTarget);

  function MediaDevices() {
    _classCallCheck(this, MediaDevices);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MediaDevices).call(this));

    _this.ondevicechange = null;
    _SourceManager2.default.getInstance().addEventListener('devicechange', function (e) {
      _this.emit('devicechange', e);
      if (typeof _this.ondevicechange === 'function') {
        _this.ondevicechange(e);
      }
    }, false);
    return _this;
  }

  _createClass(MediaDevices, [{
    key: 'enumerateDevices',
    value: function enumerateDevices() {
      return Promise.resolve(_SourceManager2.default.getInstance().deviceInfoList);
    }
  }, {
    key: 'getSupportedConstraints',
    value: function getSupportedConstraints() {
      return _SourceManager2.default.getInstance().supportedConstraints;
    }
  }, {
    key: 'getUserMedia',
    value: function getUserMedia(constraints) {
      var video = constraints.video,
          audio = constraints.audio,
          finalSet = [],
          addTrack = function addTrack(track, c) {
        if ((typeof c === 'undefined' ? 'undefined' : _typeof(c)) === 'object') {
          return track.applyConstraints(c).then(function () {
            return track;
          });
        }
        return Promise.resolve(track);
      };

      if (!video && !audio) {
        _Util2.default.throwError(new _MediaStreamError2.default('NotSupportedError', 'Either "video" or "audio" should be specified.'));
      }

      if (video) {
        finalSet.push(addTrack(new _MediaStreamTrack2.default('video', null), video));
      }

      if (audio) {
        finalSet.push(addTrack(new _MediaStreamTrack2.default('audio', null), audio));
      }
      return Promise.all(finalSet).then(function (tracks) {
        return new _MediaStream2.default(tracks);
      });
    }
  }]);

  return MediaDevices;
}(_EventTarget3.default);

exports.default = MediaDevices;