'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _SourceManager = require('./SourceManager');

var _SourceManager2 = _interopRequireDefault(_SourceManager);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

var privateData = new WeakMap();

var MediaStreamTrack = (function (_EventTarget) {
  _inherits(MediaStreamTrack, _EventTarget);

  _createClass(MediaStreamTrack, null, [{
    key: 'kindToSourceType',
    value: function kindToSourceType(kind) {
      if (kind === 'video') {
        return 'camera';
      } else {
        return 'microphone';
      }
    }
  }]);

  function MediaStreamTrack(kind, label) {
    var _this = this;

    var id = arguments.length <= 2 || arguments[2] === undefined ? _Util2['default'].issueId('track-') : arguments[2];

    _classCallCheck(this, MediaStreamTrack);

    var track = undefined,
        state = undefined;

    _get(Object.getPrototypeOf(MediaStreamTrack.prototype), 'constructor', this).call(this);

    if (kind instanceof MediaStreamTrack) {
      track = kind;
      kind = track.kind;
      label = track.label;
    }

    this.constrants = track ? _Util2['default'].copyObject(track.constraints) : null;
    this.onmute = null;
    this.onunmute = null;
    this.readonly = track ? track.readonly : true;
    this.remote = track ? track.remote : false;
    this.onended = null;
    this.onoverconstrained = null;

    var startedHandler = function startedHandler() {
      var event = { type: 'unmute' };
      _this.emit('unmute', event);
      if (typeof _this.onunmute === 'function') {
        _this.onunmute(event);
      }
    };

    var stoppedHandler = function stoppedHandler() {
      var event = { type: 'mute' };
      _this.emit('mute', event);
      if (typeof _this.onmute === 'function') {
        _this.onmute(event);
      }
    };

    var source = _SourceManager2['default'].getInstance().attachSource(id, MediaStreamTrack.kindToSourceType(kind));

    var event = { type: 'ended' };

    if (!source) {
      state = 'ended';
      this.emit('ended', event);
    } else {
      source.addEventListener('started', startedHandler, false);
      source.addEventListener('stopped', stoppedHandler, false);

      if (track && track.readyState === 'ended') {
        state = 'ended';
        this.emit('ended', event);
        if (typeof this.onended === 'function') {
          this.onended(event);
        }
      } else {
        state = 'live';
        this.emit('started');
      }
    }

    privateData.set(this, {
      kind: kind,
      id: id,
      label: label,
      enabled: track ? track.enabled : true,
      readyState: state,
      source: source,
      startedHandler: startedHandler,
      stoppedHandler: stoppedHandler
    });
  }

  _createClass(MediaStreamTrack, [{
    key: 'clone',
    value: function clone() {
      return new MediaStreamTrack(this);
    }
  }, {
    key: 'stop',
    value: function stop() {
      var source = this.source;
      if (source) {
        source.removeEventListener('started', privateData.get(this).startedHandler, false);
        source.removeEventListener('stopped', privateData.get(this).stoppedHandler, false);
        _SourceManager2['default'].getInstance().detachSource(this.id);
      }
      var event = { type: 'ended', error: null };
      privateData.get(this).source = null;
      privateData.get(this).readyState = 'ended';
      this.emit('ended', event);
      if (typeof this.onended === 'function') {
        this.onended(event);
      }
    }
  }, {
    key: 'getCapabilities',
    value: function getCapabilities() {
      return this.source && this.source.getCapabilities();
    }
  }, {
    key: 'getConstraints',
    value: function getConstraints() {
      return this.constraints;
    }
  }, {
    key: 'getSettings',
    value: function getSettings() {
      return this.source && this.source.getSettings();
    }
  }, {
    key: 'applyConstraints',
    value: function applyConstraints(constraints) {
      var _this2 = this;

      if (!this.source) {
        return Promise.resolve();
      }
      return _SourceManager2['default'].getInstance().applyConstraints(this.source, constraints).then(function (source) {
        _this2.constraints = constraints;
        privateData.get(_this2).label = source.settings.label;
      }, function (e) {
        var event = { type: 'overconstrained', error: e };
        _this2.emit('overconstrained', event);
        if (typeof _this2.onoverconstrained === 'function') {
          _this2.onoverconstrained(event);
        }
      });
    }
  }, {
    key: 'kind',
    get: function get() {
      return privateData.get(this).kind;
    }
  }, {
    key: 'id',
    get: function get() {
      return privateData.get(this).id;
    }
  }, {
    key: 'label',
    get: function get() {
      return privateData.get(this).label;
    }
  }, {
    key: 'enabled',
    get: function get() {
      return privateData.get(this).enabled;
    },
    set: function set(value) {
      var v = !!value;

      if (privateData.get(this).enabled !== v) {
        privateData.get(this).enabled = v;
        if (this.source) {
          _SourceManager2['default'].getInstance().enableSink(this.id, v);
        }
      }
    }
  }, {
    key: 'muted',
    get: function get() {
      if (this.source && !this.source.stopped) {
        return false;
      }
      return true;
    }
  }, {
    key: 'readyState',
    get: function get() {
      return privateData.get(this).readyState;
    }
  }, {
    key: 'source',
    get: function get() {
      return privateData.get(this).source;
    }
  }]);

  return MediaStreamTrack;
})(_EventTarget3['default']);

exports['default'] = MediaStreamTrack;
module.exports = exports['default'];