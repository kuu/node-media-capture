'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var privateData = new WeakMap();

// Private functions
function checkActive(stream, track) {
  var curr = privateData.get(stream).active,
      next = privateData.get(stream).tracks.some(function (t) {
    return t.readyState === 'live';
  }),
      event = { track: track };

  if (curr !== next) {
    privateData.get(stream).active = next;
    if (next) {
      stream.emit('active', event);
    } else {
      stream.emit('inactive', event);
    }
  }
}

function addEndedHandler(stream, track) {
  var f = function f() {
    try {
      privateData.get(stream).checkActive(stream, track);
    } catch (e) {
      console.log('WOW!', e);
    }
  };
  track.addEventListener('ended', f, false);
  return f;
}

function removeEndedHandler(track, f) {
  track.removeEventListener('ended', f, false);
}

var MediaStream = function (_EventTarget) {
  _inherits(MediaStream, _EventTarget);

  function MediaStream(param) {
    _classCallCheck(this, MediaStream);

    var tracks = void 0;

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MediaStream).call(this));

    if (!param) {
      tracks = [];
    } else if (param instanceof MediaStream) {
      tracks = param.getTracks();
    } else if (typeof param.length === 'number') {
      tracks = Array.prototype.slice.call(param, 0);
    }

    _this.onactive = null;
    _this.oninactive = null;
    _this.onaddtrack = null;
    _this.onremovetrack = null;

    var handlers = new WeakMap();

    privateData.set(_this, {
      id: _Util2.default.issueId('stream-'),
      tracks: tracks,
      active: tracks.some(function (track) {
        return track.readyState === 'live';
      }),
      endedHandlers: handlers,
      checkActive: checkActive,
      addEndedHandler: addEndedHandler,
      removeEndedHandler: removeEndedHandler
    });

    tracks.forEach(function (track) {
      handlers.set(track, privateData.get(_this).addEndedHandler(_this, track));
    });
    return _this;
  }

  _createClass(MediaStream, [{
    key: 'getTracks',
    value: function getTracks() {
      return privateData.get(this).tracks.slice(0);
    }
  }, {
    key: 'clone',
    value: function clone() {
      var tracks = [];

      privateData.get(this).tracks.forEach(function (track) {
        tracks.push(track.clone());
      });
      return new MediaStream(tracks);
    }
  }, {
    key: 'getTrackById',
    value: function getTrackById(id) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = privateData.get(this).tracks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var track = _step.value;

          if (track.id === id) {
            return track;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return null;
    }
  }, {
    key: 'addTrack',
    value: function addTrack(track) {
      var tracks = privateData.get(this).tracks,
          event = { track: track },
          handlers = void 0;

      if (tracks.indexOf(track) !== -1) {
        return;
      }
      tracks.push(track);
      privateData.get(this).checkActive(this, track);
      handlers = privateData.get(this).endedHandlers;
      handlers.set(track, privateData.get(this).addEndedHandler(this, track));
      this.emit('addtrack', event);
      if (typeof this.onaddtrack === 'function') {
        this.onaddtrack(event);
      }
    }
  }, {
    key: 'removeTrack',
    value: function removeTrack(track) {
      var tracks = privateData.get(this).tracks,
          index = tracks.indexOf(track),
          event = { track: track };

      if (index === -1) {
        return;
      }
      tracks.splice(index, 1);
      privateData.get(this).checkActive(this, track);
      privateData.get(this).removeEndedHandler(track, privateData.get(this).endedHandlers.get(track));
      this.emit('removetrack', event);
      if (typeof this.onremovetrack === 'function') {
        this.onremovetrack(event);
      }
    }
  }, {
    key: 'getAudioTracks',
    value: function getAudioTracks() {
      return privateData.get(this).tracks.filter(function (track) {
        return track.kind === 'audio';
      });
    }
  }, {
    key: 'getVideoTracks',
    value: function getVideoTracks() {
      return privateData.get(this).tracks.filter(function (track) {
        return track.kind === 'video';
      });
    }
  }, {
    key: 'id',
    get: function get() {
      return privateData.get(this).id;
    }
  }, {
    key: 'active',
    get: function get() {
      return privateData.get(this).active;
    }
  }]);

  return MediaStream;
}(_EventTarget3.default);

exports.default = MediaStream;