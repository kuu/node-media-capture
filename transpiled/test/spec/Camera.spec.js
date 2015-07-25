'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _srcSource = require('../../src/Source');

var _srcSource2 = _interopRequireDefault(_srcSource);

var _srcSourceManager = require('../../src/SourceManager');

var _srcSourceManager2 = _interopRequireDefault(_srcSourceManager);

var _srcCamera = require('../../src/Camera');

var _srcCamera2 = _interopRequireDefault(_srcCamera);

var _powerAssert = require('power-assert');

/*global describe, it, beforeEach*/

var _powerAssert2 = _interopRequireDefault(_powerAssert);

describe('Camera', function () {

  var hal;
  var camera;

  beforeEach(function () {
    hal = _srcSourceManager2['default'].getInstance().hal;
    camera = new _srcCamera2['default'](hal, 'deviceId-01');
    void camera;
  });

  it('can be initialized with default options', function () {
    var c = new _srcCamera2['default'](hal, 'deviceId-01');

    _powerAssert2['default'].equal(c.sourceType, _srcSource2['default'].TYPE_CAMERA);
    _powerAssert2['default'].equal(c.deviceId, 'deviceId-01');
    _powerAssert2['default'].equal(c.groupId, void 0);
    _powerAssert2['default'].deepEqual(c.getCapabilities(), _srcCamera2['default'].DEFAULT_CAPABILITY);
    _powerAssert2['default'].deepEqual(c.getSettings(), {
      width: _srcCamera2['default'].DEFAULT_CAPABILITY.width.defaultSetting,
      height: _srcCamera2['default'].DEFAULT_CAPABILITY.height.defaultSetting,
      frameRate: _srcCamera2['default'].DEFAULT_CAPABILITY.frameRate.defaultSetting,
      aspectRatio: _srcCamera2['default'].DEFAULT_CAPABILITY.aspectRatio.defaultSetting,
      facingMode: _srcCamera2['default'].DEFAULT_CAPABILITY.facingMode.defaultSetting
    });
  });

  it('can be initialized with specific options', function () {
    var capability = {
      width: { min: 1, max: 9999, defaultSetting: 640 },
      height: { min: 1, max: 9999, defaultSetting: 480 },
      frameRate: { min: 1, max: 999, defaultSetting: 30 },
      aspectRatio: { oneOf: [3 / 2, 4 / 3, 16 / 9], defaultSetting: 4 / 3 },
      facingMode: {
        oneOf: [_srcCamera2['default'].FACING_MODE_USER, _srcCamera2['default'].FACING_MODE_ENVIRONMENT, _srcCamera2['default'].FACING_MODE_LEFT, _srcCamera2['default'].FACING_MODE_RIGHT],
        defaultSetting: _srcCamera2['default'].FACING_MODE_RIGHT
      }
    },
        c = new _srcCamera2['default'](hal, 'deviceId-01', 'groupId-01', capability);

    _powerAssert2['default'].equal(c.sourceType, _srcSource2['default'].TYPE_CAMERA);
    _powerAssert2['default'].equal(c.deviceId, 'deviceId-01');
    _powerAssert2['default'].equal(c.groupId, 'groupId-01');
    _powerAssert2['default'].deepEqual(c.getCapabilities(), capability);
    _powerAssert2['default'].deepEqual(c.getSettings(), {
      width: capability.width.defaultSetting,
      height: capability.height.defaultSetting,
      frameRate: capability.frameRate.defaultSetting,
      aspectRatio: capability.aspectRatio.defaultSetting,
      facingMode: capability.facingMode.defaultSetting
    });
  });

  it('can be reset with valid constraints', function () {
    var constraints,
        settings,
        ret,
        reason,
        defaultCapability = _srcCamera2['default'].DEFAULT_CAPABILITY;

    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, defaultCapability.width.defaultSetting);
    _powerAssert2['default'].equal(settings.height, defaultCapability.height.defaultSetting);
    _powerAssert2['default'].equal(settings.aspectRatio, defaultCapability.aspectRatio.defaultSetting);

    constraints = {
      width: 1280,
      height: 720,
      aspectRatio: 16 / 9
    };

    var _camera$applyConstraints = camera.applyConstraints(constraints);

    var _camera$applyConstraints2 = _slicedToArray(_camera$applyConstraints, 2);

    ret = _camera$applyConstraints2[0];
    reason = _camera$applyConstraints2[1];

    _powerAssert2['default'].equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 1280);
    _powerAssert2['default'].equal(settings.height, 720);
    _powerAssert2['default'].equal(settings.aspectRatio, 16 / 9);

    constraints = {
      width: { min: 640, ideal: 640 },
      height: { min: 480, ideal: 480 },
      aspectRatio: 4 / 3
    };

    var _camera$applyConstraints3 = camera.applyConstraints(constraints);

    var _camera$applyConstraints32 = _slicedToArray(_camera$applyConstraints3, 2);

    ret = _camera$applyConstraints32[0];
    reason = _camera$applyConstraints32[1];

    _powerAssert2['default'].equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 640);
    _powerAssert2['default'].equal(settings.height, 480);
    _powerAssert2['default'].equal(settings.aspectRatio, 4 / 3);

    constraints = {
      width: { exact: defaultCapability.width.min - 1 }
    };

    var _camera$applyConstraints4 = camera.applyConstraints(constraints);

    var _camera$applyConstraints42 = _slicedToArray(_camera$applyConstraints4, 2);

    ret = _camera$applyConstraints42[0];
    reason = _camera$applyConstraints42[1];

    _powerAssert2['default'].equal(ret, false);
    _powerAssert2['default'].equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 640);

    constraints = {
      width: { exact: defaultCapability.width.max + 1 }
    };

    var _camera$applyConstraints5 = camera.applyConstraints(constraints);

    var _camera$applyConstraints52 = _slicedToArray(_camera$applyConstraints5, 2);

    ret = _camera$applyConstraints52[0];
    reason = _camera$applyConstraints52[1];

    _powerAssert2['default'].equal(ret, false);
    _powerAssert2['default'].equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 640);

    constraints = {
      width: { ideal: defaultCapability.width.min - 1 }
    };

    var _camera$applyConstraints6 = camera.applyConstraints(constraints);

    var _camera$applyConstraints62 = _slicedToArray(_camera$applyConstraints6, 2);

    ret = _camera$applyConstraints62[0];
    reason = _camera$applyConstraints62[1];

    _powerAssert2['default'].equal(ret, false);
    _powerAssert2['default'].equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 640);

    constraints = {
      width: { ideal: defaultCapability.width.max + 1 }
    };

    var _camera$applyConstraints7 = camera.applyConstraints(constraints);

    var _camera$applyConstraints72 = _slicedToArray(_camera$applyConstraints7, 2);

    ret = _camera$applyConstraints72[0];
    reason = _camera$applyConstraints72[1];

    _powerAssert2['default'].equal(ret, false);
    _powerAssert2['default'].equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 640);

    constraints = {
      aspectRatio: 1.5
    };

    var _camera$applyConstraints8 = camera.applyConstraints(constraints);

    var _camera$applyConstraints82 = _slicedToArray(_camera$applyConstraints8, 2);

    ret = _camera$applyConstraints82[0];
    reason = _camera$applyConstraints82[1];

    _powerAssert2['default'].equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 720);
    _powerAssert2['default'].equal(settings.height, 480);
    _powerAssert2['default'].equal(settings.aspectRatio, 1.5);

    constraints = {
      width: 1080
    };

    var _camera$applyConstraints9 = camera.applyConstraints(constraints);

    var _camera$applyConstraints92 = _slicedToArray(_camera$applyConstraints9, 2);

    ret = _camera$applyConstraints92[0];
    reason = _camera$applyConstraints92[1];

    _powerAssert2['default'].equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 1080);
    _powerAssert2['default'].equal(settings.height, 720);
    _powerAssert2['default'].equal(settings.aspectRatio, 1.5);

    constraints = {
      height: 240
    };

    var _camera$applyConstraints10 = camera.applyConstraints(constraints);

    var _camera$applyConstraints102 = _slicedToArray(_camera$applyConstraints10, 2);

    ret = _camera$applyConstraints102[0];
    reason = _camera$applyConstraints102[1];

    _powerAssert2['default'].equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2['default'].equal(settings.width, 360);
    _powerAssert2['default'].equal(settings.height, 240);
    _powerAssert2['default'].equal(settings.aspectRatio, 1.5);
  });

  it('can be initialized with specific options', function () {});
});