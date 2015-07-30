'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _Source = require('./Source');

var _Source2 = _interopRequireDefault(_Source);

var _Camera = require('./Camera');

var _Camera2 = _interopRequireDefault(_Camera);

var _Microphone = require('./Microphone');

var _Microphone2 = _interopRequireDefault(_Microphone);

var _MediaStreamError = require('./MediaStreamError');

var _MediaStreamError2 = _interopRequireDefault(_MediaStreamError);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

var _HAL = require('./HAL');

var _HAL2 = _interopRequireDefault(_HAL);

var privateData = new WeakMap();

// Private function
function prepareSources(manager) {
  var deviceList = undefined,
      sources = manager.sources,
      cameras = sources.get(_Source2['default'].TYPE_CAMERA),
      microphones = sources.get(_Source2['default'].TYPE_MICROPHONE),
      promises = [];

  deviceList = manager.hal.getAvailableDeviceInfo();
  privateData.get(manager).deviceInfoList = deviceList;

  deviceList.forEach(function (deviceInfo) {
    var source = undefined,
        addSource = function addSource(sourceSet, SourceClass) {
      var alreadyExists = false,
          s = null;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = sourceSet[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var entry = _step.value;

          if (entry.deviceId === deviceInfo.deviceId) {
            alreadyExists = true;
            break;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (!alreadyExists) {
        s = new SourceClass(manager.hal, deviceInfo.deviceId, deviceInfo.groupId, deviceInfo.capabilities);
        sourceSet.add(s);
      }
      return s;
    };

    if (deviceInfo.kind === 'videoinput') {
      source = addSource(cameras, _Camera2['default']);
    } else if (deviceInfo.kind === 'audioinput') {
      source = addSource(microphones, _Microphone2['default']);
    }

    if (source) {
      promises.push(source.init());
      source.addEventListener('data', function (data) {
        var iterator = manager.trackEntries.values();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = iterator[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var item = _step2.value;

            if (item.source !== source) {
              continue;
            }
            var list = item.sink;
            if (list) {
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var sink = _step3.value;

                  if (sink.enabled) {
                    // actual content
                    sink.onData(data);
                  } else {
                    //  zero-information-content
                    sink.onData({ data: item.source.getZeroInformationContent() });
                  }
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                    _iterator3['return']();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
              _iterator2['return']();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }, false);
    }
  });

  return Promise.all(promises).then(function () {
    console.log('SourceManager: All sources have been initialized.');
    manager.emit('initialized');
    return manager;
  });
}

var Entry = function Entry(source) {
  _classCallCheck(this, Entry);

  this.source = source;
  this.sink = null;
};

var SourceManager = (function (_EventTarget) {
  _inherits(SourceManager, _EventTarget);

  _createClass(SourceManager, null, [{
    key: 'getInstance',
    value: function getInstance() {
      return SourceManager.instance;
    }
  }]);

  function SourceManager() {
    var _this = this;

    _classCallCheck(this, SourceManager);

    var hal = undefined;

    _get(Object.getPrototypeOf(SourceManager.prototype), 'constructor', this).call(this);

    privateData.set(this, {
      deviceInfoList: null,
      prepareSources: prepareSources,
      error: false
    });

    this.sources = new Map([[_Source2['default'].TYPE_CAMERA, new Set()], [_Source2['default'].TYPE_MICROPHONE, new Set()]]);
    this.trackEntries = new Map();
    hal = this.hal = new _HAL2['default']();

    // Device discovery
    hal.addEventListener('change', function (e) {
      privateData.get(_this).prepareSources(_this).then(function () {
        _this.emit('devicechange', e);
      });
    }, false);

    privateData.get(this).prepareSources(this).then(function () {
      privateData.get(_this).error = false;
    }, function () {
      privateData.get(_this).error = true;
    });
  }

  _createClass(SourceManager, [{
    key: 'attachSource',
    value: function attachSource(trackId, sourceType) {

      if (privateData.get(this).error) {
        return null;
      }

      var trackEntries = this.trackEntries,
          entry = undefined,
          sources = undefined;

      entry = trackEntries.get(trackId);

      if (entry) {
        return entry.source;
      }

      sources = this.sources.get(sourceType);

      if (!sources) {
        _Util2['default'].throwError(new Error('Unsupported sourceType.'));
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = sources[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var source = _step4.value;

          trackEntries.set(trackId, new Entry(source));
          return source;
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4['return']) {
            _iterator4['return']();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      _Util2['default'].throwError(new Error('Invalid constraints.'));
    }
  }, {
    key: 'detachSource',
    value: function detachSource(trackId) {
      var trackEntries = this.trackEntries,
          entry = undefined;

      entry = trackEntries.get(trackId);
      if (entry) {
        entry.source.dereference(trackId);
        trackEntries['delete'](trackId);
      }
    }
  }, {
    key: 'applyConstraints',
    value: function applyConstraints(source, constraints) {
      return Promise.resolve().then(function () {
        var basic, advanced, result, reason;

        if (!constraints) {
          return source;
        }

        // Split the constraints object into basic/advanced.
        Object.keys(constraints).forEach(function (key) {
          var entry = constraints[key];

          if (key === 'advanced') {
            advanced = entry;
          } else {
            if (!basic) {
              basic = {};
            }
            basic[key] = entry;
          }
        });

        if (basic) {
          var _source$applyConstraints = source.applyConstraints(basic);

          // Apply basic constraint.

          var _source$applyConstraints2 = _slicedToArray(_source$applyConstraints, 2);

          result = _source$applyConstraints2[0];
          reason = _source$applyConstraints2[1];

          if (!result) {
            _Util2['default'].throwError(new _MediaStreamError2['default']('OverconstrainedError', 'Unable to apply constraints.', reason));
          }
          if (!advanced) {
            source.update();
            return source;
          }
        }

        if (advanced) {
          // Apply advanced constraints.
          if (advanced.some(function (constraint) {
            var _source$applyConstraints3 = source.applyConstraints(constraint);

            var _source$applyConstraints32 = _slicedToArray(_source$applyConstraints3, 2);

            result = _source$applyConstraints32[0];
            reason = _source$applyConstraints32[1];

            return result;
          })) {
            source.update();
            return source;
          }
        }
        _Util2['default'].throwError(new _MediaStreamError2['default']('OverconstrainedError', 'Unable to apply constraints.', reason));
      });
    }
  }, {
    key: 'addSink',
    value: function addSink(trackId, sink) {
      var entry,
          trackEntries = this.trackEntries;

      entry = trackEntries.get(trackId);

      if (entry) {
        var list = entry.sink;
        if (!list) {
          entry.source.reference(trackId);
          list = entry.sink = [];
        }
        list.push(sink);
      }
    }
  }, {
    key: 'removeSink',
    value: function removeSink(trackId, sink) {
      var entry,
          trackEntries = this.trackEntries;

      entry = trackEntries.get(trackId);

      if (entry) {
        var list = entry.sink;
        if (list) {
          var index = list.indexOf(sink);
          if (index !== -1) {
            list.splice(index, 1);
            if (list.length === 0) {
              entry.source.dereference(trackId);
              entry.sink = null;
            }
          }
        }
      }
    }
  }, {
    key: 'enableSink',
    value: function enableSink(trackId, value) {
      var entry,
          trackEntries = this.trackEntries;

      entry = trackEntries.get(trackId);

      if (entry) {
        var list = entry.sink;
        if (list) {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = list[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var item = _step5.value;

              item.enabled = value;
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                _iterator5['return']();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      }
    }
  }, {
    key: 'deviceInfoList',
    get: function get() {
      return privateData.get(this).deviceInfoList;
    }
  }, {
    key: 'supportedConstraints',
    get: function get() {
      return this.hal.supportedConstraints;
    }
  }]);

  return SourceManager;
})(_EventTarget3['default']);

exports['default'] = SourceManager;

Promise.any = _Util2['default'].promiseAny;
SourceManager.instance = new SourceManager();
module.exports = exports['default'];