'use strict';

var _SourceManager = require('../../src/SourceManager');

var _SourceManager2 = _interopRequireDefault(_SourceManager);

var _Source = require('../../src/Source');

var _Source2 = _interopRequireDefault(_Source);

var _Camera = require('../../src/Camera');

var _Camera2 = _interopRequireDefault(_Camera);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global describe, it, beforeEach*/

describe('SourceManager', function () {

  var manager;

  beforeEach(function () {
    manager = _SourceManager2.default.getInstance();
    /*
        manager.addEventListener('initialized', function () {
          done();
        }, false);
    */
  });

  describe('applyConstraints', function (done) {
    it('can apply basic and advanced constraints', function () {
      var constraints, camera, capability, settings;

      capability = {
        width: { min: 640, max: 1920, defaultValue: 1280 },
        height: { min: 480, max: 1280, defaultValue: 720 },
        frameRate: { min: 15, max: 60, defaultValue: 30 },
        aspectRatio: { oneOf: [3 / 2, 4 / 3, 16 / 9], defaultValue: 16 / 9 },
        facingMode: {
          oneOf: [_Camera2.default.FACING_MODE_USER, _Camera2.default.FACING_MODE_ENVIRONMENT, _Camera2.default.FACING_MODE_LEFT, _Camera2.default.FACING_MODE_RIGHT],
          defaultValue: _Camera2.default.FACING_MODE_USER
        }
      };

      camera = new _Camera2.default('abc', '', capability);

      constraints = {
        width: 1280,
        height: 720,
        aspectRatio: 1.5
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 1280);
        _powerAssert2.default.equal(settings.height, 720);
        _powerAssert2.default.equal(settings.aspectRatio, 1.5);
        done();
      });

      constraints = {
        width: { min: 640, ideal: 640 },
        height: { min: 480, ideal: 480 },
        aspectRatio: 4 / 3
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 640);
        _powerAssert2.default.equal(settings.height, 480);
        _powerAssert2.default.equal(settings.aspectRatio, 4 / 3);
        done();
      });

      constraints = {
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 },
        advanced: [{ width: 1920, height: 1280 }, { aspectRatio: 16 / 9 }]
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 1920);
        _powerAssert2.default.equal(settings.height, 1280);
        _powerAssert2.default.equal(settings.aspectRatio, 4 / 3);
        done();
      });

      constraints = {
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 },
        advanced: [{ width: 1920, height: 1281 }, { aspectRatio: 16 / 9 }]
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 1280);
        _powerAssert2.default.equal(settings.height, 720);
        _powerAssert2.default.equal(settings.aspectRatio, 16 / 9);
        done();
      });

      constraints = {
        width: { min: 640 },
        height: { min: 480 },
        advanced: [{ width: 650 }, { width: { min: 650 } }, { frameRate: 60 }, { width: { max: 800 } }, { facingMode: _Camera2.default.FACING_MODE_USER }]
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 650);
        _powerAssert2.default.equal(settings.height, capability.height.defaultValue);
        done();
      });

      constraints = {
        width: { min: 640 },
        height: { min: 480 },
        advanced: [{ width: 630 }, { width: { min: 650 } }, { frameRate: 60 }, { width: { max: 800 } }, { facingMode: _Camera2.default.FACING_MODE_USER }]
      };

      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, capability.width.defaultValue);
        _powerAssert2.default.equal(settings.height, capability.height.defaultValue);
        done();
      });

      constraints = {
        deviceId: { exact: 'abc' },
        advanced: [{ width: 800 }, { height: { min: 600 } }]
      };
      manager.applyConstraints(camera, constraints).then(function () {
        settings = camera.getSettings();
        _powerAssert2.default.equal(settings.width, 800);
        _powerAssert2.default.equal(settings.height, capability.height.defaultValue);
        done();
      });

      constraints = {
        deviceId: { exact: 'abd' },
        advanced: [{ width: 800 }, { height: { min: 600 } }]
      };
      manager.applyConstraints(camera, constraints).then(function () {
        done();
      });
    });
  });

  describe('attachSource', function () {
    it('can attach a trackId to source', function (done) {
      var constraints = void 0,
          settings = void 0,
          source1 = void 0,
          source2 = void 0;

      constraints = {
        width: 1920,
        height: 1080,
        frameRate: 30,
        aspectRatio: 16 / 9
      };
      source1 = manager.attachSource('abcdefg', 'camera');
      manager.applyConstraints(source1, constraints).then(function () {
        settings = source1.getSettings();
        _powerAssert2.default.equal(settings.width, 1920);
        _powerAssert2.default.equal(settings.height, 1080);
        _powerAssert2.default.equal(settings.frameRate, 30);
        _powerAssert2.default.equal(settings.aspectRatio, 16 / 9);

        constraints = {
          width: 640,
          height: 480,
          frameRate: 15,
          aspectRatio: 4 / 3
        };

        source2 = manager.attachSource('abcdefg', 'camera');
        manager.applyConstraints(source2, constraints).then(function () {
          _powerAssert2.default.equal(source1, source2);
          settings = source1.getSettings();
          _powerAssert2.default.equal(settings.width, 640);
          _powerAssert2.default.equal(settings.height, 480);
          _powerAssert2.default.equal(settings.frameRate, 15);
          _powerAssert2.default.equal(settings.aspectRatio, 4 / 3);
          settings = source2.getSettings();
          _powerAssert2.default.equal(settings.width, 640);
          _powerAssert2.default.equal(settings.height, 480);
          _powerAssert2.default.equal(settings.frameRate, 15);
          _powerAssert2.default.equal(settings.aspectRatio, 4 / 3);
          manager.detachSource('abcdefg');
          done();
        });
      });
    });
  });

  describe('addSink', function () {
    it('can manage multiple sink objects', function () {
      var source1 = void 0,
          source2 = void 0,
          sink1 = { enabled: true, onData: function onData() {} },
          sink2 = { enabled: true, onData: function onData() {} },
          dummyData = { dummy: true };

      _sinon2.default.spy(sink1, 'onData');
      _sinon2.default.spy(sink2, 'onData');

      source1 = manager.attachSource('track-id-001', 'camera');
      source2 = manager.attachSource('track-id-002', 'camera');
      manager.addSink('track-id-001', sink1);
      manager.addSink('track-id-002', sink2);
      manager.sources.get(_Source2.default.TYPE_CAMERA).forEach(function (camera) {
        if (camera.deviceId === source1.deviceId || camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      (0, _powerAssert2.default)(sink1.onData.calledWith(dummyData), true);
      (0, _powerAssert2.default)(sink2.onData.calledWith(dummyData), true);
      manager.enableSink('track-id-002', false);
      manager.sources.get(_Source2.default.TYPE_CAMERA).forEach(function (camera) {
        if (camera.deviceId === source1.deviceId || camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      (0, _powerAssert2.default)(sink1.onData.calledWith(dummyData), true);
      (0, _powerAssert2.default)(sink2.onData.calledWith(null), true);
      manager.removeSink('track-id-001', sink1);
      manager.removeSink('track-id-002', sink2);
      manager.sources.get(_Source2.default.TYPE_CAMERA).forEach(function (camera) {
        if (camera.deviceId === source1.deviceId || camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      (0, _powerAssert2.default)(sink1.onData.called, false);
      (0, _powerAssert2.default)(sink2.onData.called, false);
      manager.detachSource('track-id-001');
      manager.detachSource('track-id-002');
    });
  });
});