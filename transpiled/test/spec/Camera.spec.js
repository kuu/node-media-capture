'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _Source = require('../../src/Source');

var _Source2 = _interopRequireDefault(_Source);

var _SourceManager = require('../../src/SourceManager');

var _SourceManager2 = _interopRequireDefault(_SourceManager);

var _Camera = require('../../src/Camera');

var _Camera2 = _interopRequireDefault(_Camera);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global describe, it, beforeEach*/

describe('Camera', function () {

  var hal;
  var camera;

  beforeEach(function () {
    hal = _SourceManager2.default.getInstance().hal;
    camera = new _Camera2.default(hal, 'deviceId-01');
    void camera;
  });

  it('can be initialized with default options', function () {
    var c = new _Camera2.default(hal, 'deviceId-01');

    _powerAssert2.default.equal(c.sourceType, _Source2.default.TYPE_CAMERA);
    _powerAssert2.default.equal(c.deviceId, 'deviceId-01');
    _powerAssert2.default.equal(c.groupId, void 0);
    _powerAssert2.default.deepEqual(c.getCapabilities(), _Camera2.default.DEFAULT_CAPABILITY);
    _powerAssert2.default.deepEqual(c.getSettings(), {
      width: _Camera2.default.DEFAULT_CAPABILITY.width.defaultValue,
      height: _Camera2.default.DEFAULT_CAPABILITY.height.defaultValue,
      frameRate: _Camera2.default.DEFAULT_CAPABILITY.frameRate.defaultValue,
      aspectRatio: _Camera2.default.DEFAULT_CAPABILITY.aspectRatio.defaultValue,
      facingMode: _Camera2.default.DEFAULT_CAPABILITY.facingMode.defaultValue
    });
  });

  it('can be initialized with specific options', function () {
    var capability = {
      width: { min: 1, max: 9999, defaultValue: 640 },
      height: { min: 1, max: 9999, defaultValue: 480 },
      frameRate: { min: 1, max: 999, defaultValue: 30 },
      aspectRatio: { oneOf: [3 / 2, 4 / 3, 16 / 9], defaultValue: 4 / 3 },
      facingMode: {
        oneOf: [_Camera2.default.FACING_MODE_USER, _Camera2.default.FACING_MODE_ENVIRONMENT, _Camera2.default.FACING_MODE_LEFT, _Camera2.default.FACING_MODE_RIGHT],
        defaultValue: _Camera2.default.FACING_MODE_RIGHT
      }
    },
        c = new _Camera2.default(hal, 'deviceId-01', 'groupId-01', capability);

    _powerAssert2.default.equal(c.sourceType, _Source2.default.TYPE_CAMERA);
    _powerAssert2.default.equal(c.deviceId, 'deviceId-01');
    _powerAssert2.default.equal(c.groupId, 'groupId-01');
    _powerAssert2.default.deepEqual(c.getCapabilities(), capability);
    _powerAssert2.default.deepEqual(c.getSettings(), {
      width: capability.width.defaultValue,
      height: capability.height.defaultValue,
      frameRate: capability.frameRate.defaultValue,
      aspectRatio: capability.aspectRatio.defaultValue,
      facingMode: capability.facingMode.defaultValue
    });
  });

  it('can be reset with valid constraints', function () {
    var constraints,
        settings,
        ret,
        reason,
        defaultCapability = _Camera2.default.DEFAULT_CAPABILITY;

    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, defaultCapability.width.defaultValue);
    _powerAssert2.default.equal(settings.height, defaultCapability.height.defaultValue);
    _powerAssert2.default.equal(settings.aspectRatio, defaultCapability.aspectRatio.defaultValue);

    constraints = {
      width: 1280,
      height: 720,
      aspectRatio: 16 / 9
    };

    var _camera$applyConstrai = camera.applyConstraints(constraints);

    var _camera$applyConstrai2 = _slicedToArray(_camera$applyConstrai, 2);

    ret = _camera$applyConstrai2[0];
    reason = _camera$applyConstrai2[1];

    _powerAssert2.default.equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 1280);
    _powerAssert2.default.equal(settings.height, 720);
    _powerAssert2.default.equal(settings.aspectRatio, 16 / 9);

    constraints = {
      width: { min: 640, ideal: 640 },
      height: { min: 480, ideal: 480 },
      aspectRatio: 4 / 3
    };

    var _camera$applyConstrai3 = camera.applyConstraints(constraints);

    var _camera$applyConstrai4 = _slicedToArray(_camera$applyConstrai3, 2);

    ret = _camera$applyConstrai4[0];
    reason = _camera$applyConstrai4[1];

    _powerAssert2.default.equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 640);
    _powerAssert2.default.equal(settings.height, 480);
    _powerAssert2.default.equal(settings.aspectRatio, 4 / 3);

    constraints = {
      width: { exact: defaultCapability.width.min - 1 }
    };

    var _camera$applyConstrai5 = camera.applyConstraints(constraints);

    var _camera$applyConstrai6 = _slicedToArray(_camera$applyConstrai5, 2);

    ret = _camera$applyConstrai6[0];
    reason = _camera$applyConstrai6[1];

    _powerAssert2.default.equal(ret, false);
    _powerAssert2.default.equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 640);

    constraints = {
      width: { exact: defaultCapability.width.max + 1 }
    };

    var _camera$applyConstrai7 = camera.applyConstraints(constraints);

    var _camera$applyConstrai8 = _slicedToArray(_camera$applyConstrai7, 2);

    ret = _camera$applyConstrai8[0];
    reason = _camera$applyConstrai8[1];

    _powerAssert2.default.equal(ret, false);
    _powerAssert2.default.equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 640);

    constraints = {
      width: { ideal: defaultCapability.width.min - 1 }
    };

    var _camera$applyConstrai9 = camera.applyConstraints(constraints);

    var _camera$applyConstrai10 = _slicedToArray(_camera$applyConstrai9, 2);

    ret = _camera$applyConstrai10[0];
    reason = _camera$applyConstrai10[1];

    _powerAssert2.default.equal(ret, false);
    _powerAssert2.default.equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 640);

    constraints = {
      width: { ideal: defaultCapability.width.max + 1 }
    };

    var _camera$applyConstrai11 = camera.applyConstraints(constraints);

    var _camera$applyConstrai12 = _slicedToArray(_camera$applyConstrai11, 2);

    ret = _camera$applyConstrai12[0];
    reason = _camera$applyConstrai12[1];

    _powerAssert2.default.equal(ret, false);
    _powerAssert2.default.equal(reason, 'width');
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 640);

    constraints = {
      aspectRatio: 1.5
    };

    var _camera$applyConstrai13 = camera.applyConstraints(constraints);

    var _camera$applyConstrai14 = _slicedToArray(_camera$applyConstrai13, 2);

    ret = _camera$applyConstrai14[0];
    reason = _camera$applyConstrai14[1];

    _powerAssert2.default.equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 720);
    _powerAssert2.default.equal(settings.height, 480);
    _powerAssert2.default.equal(settings.aspectRatio, 1.5);

    constraints = {
      width: 1080
    };

    var _camera$applyConstrai15 = camera.applyConstraints(constraints);

    var _camera$applyConstrai16 = _slicedToArray(_camera$applyConstrai15, 2);

    ret = _camera$applyConstrai16[0];
    reason = _camera$applyConstrai16[1];

    _powerAssert2.default.equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 1080);
    _powerAssert2.default.equal(settings.height, 720);
    _powerAssert2.default.equal(settings.aspectRatio, 1.5);

    constraints = {
      height: 240
    };

    var _camera$applyConstrai17 = camera.applyConstraints(constraints);

    var _camera$applyConstrai18 = _slicedToArray(_camera$applyConstrai17, 2);

    ret = _camera$applyConstrai18[0];
    reason = _camera$applyConstrai18[1];

    _powerAssert2.default.equal(ret, true);
    settings = camera.getSettings();
    _powerAssert2.default.equal(settings.width, 360);
    _powerAssert2.default.equal(settings.height, 240);
    _powerAssert2.default.equal(settings.aspectRatio, 1.5);
  });

  it('can be initialized with specific options', function () {});
});