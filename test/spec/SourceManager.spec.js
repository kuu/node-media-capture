import SourceManager from '../../src/SourceManager';
import Source from '../../src/Source';
import Camera from '../../src/Camera';
import assert from 'power-assert';
import sinon from 'sinon';

/*global describe, it, beforeEach*/

describe('SourceManager', function () {

  var manager;

  beforeEach(function () {
    manager = SourceManager.getInstance();
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
        width: {min: 640, max: 1920, defaultSetting: 1280},
        height: {min: 480, max: 1280, defaultSetting: 720},
        frameRate: {min: 15, max: 60, defaultSetting: 30},
        aspectRatio: {oneOf: [3 / 2, 4 / 3, 16 / 9], defaultSetting: 16 / 9},
        facingMode: {
          oneOf: [
            Camera.FACING_MODE_USER,
            Camera.FACING_MODE_ENVIRONMENT,
            Camera.FACING_MODE_LEFT,
            Camera.FACING_MODE_RIGHT
          ],
          defaultSetting: Camera.FACING_MODE_USER
        }
      };

      camera = new Camera('abc', '', capability);

      constraints = {
        width: 1280,
        height: 720,
        aspectRatio: 1.5
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 1280);
        assert.equal(settings.height, 720);
        assert.equal(settings.aspectRatio, 1.5);
        done();
      });

      constraints = {
        width: {min: 640, ideal: 640},
        height: {min: 480, ideal: 480},
        aspectRatio: 4 / 3
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 640);
        assert.equal(settings.height, 480);
        assert.equal(settings.aspectRatio, 4 / 3);
        done();
      });

      constraints = {
        width: {min: 640, ideal: 1280},
        height: {min: 480, ideal: 720},
        advanced: [
          {width: 1920, height: 1280},
          {aspectRatio: 16 / 9}
        ]
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 1920);
        assert.equal(settings.height, 1280);
        assert.equal(settings.aspectRatio, 4 / 3);
        done();
      });

      constraints = {
        width: {min: 640, ideal: 1280},
        height: {min: 480, ideal: 720},
        advanced: [
          {width: 1920, height: 1281},
          {aspectRatio: 16 / 9}
        ]
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 1280);
        assert.equal(settings.height, 720);
        assert.equal(settings.aspectRatio, 16 / 9);
        done();
      });

      constraints = {
        width: {min: 640},
        height: {min: 480},
        advanced: [
          {width: 650},
          {width: {min: 650}},
          {frameRate: 60},
          {width: {max: 800}},
          {facingMode: Camera.FACING_MODE_USER}
        ]
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 650);
        assert.equal(settings.height, capability.height.defaultSetting);
        done();
      });

      constraints = {
        width: {min: 640},
        height: {min: 480},
        advanced: [
          {width: 630},
          {width: {min: 650}},
          {frameRate: 60},
          {width: {max: 800}},
          {facingMode: Camera.FACING_MODE_USER}
        ]
      };

      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, capability.width.defaultSetting);
        assert.equal(settings.height, capability.height.defaultSetting);
        done();
      });

      constraints = {
        deviceId: {exact: 'abc'},
        advanced: [
          {width: 800},
          {height: {min: 600}}
        ]
      };
      manager.applyConstraints(camera, constraints)
      .then(() => {
        settings = camera.getSettings();
        assert.equal(settings.width, 800);
        assert.equal(settings.height, capability.height.defaultSetting);
        done();
      });

      constraints = {
        deviceId: {exact: 'abd'},
        advanced: [
          {width: 800},
          {height: {min: 600}}
        ]
      };
      manager.applyConstraints(camera, constraints)
      .then(() => {
        done();
      });
    });
  });

  describe('attachSource', function () {
    it('can attach a trackId to source', function (done) {
      let constraints, settings, source1, source2;

      constraints = {
        width: 1920,
        height: 1080,
        frameRate: 30,
        aspectRatio: 16 / 9
      };
      source1 = manager.attachSource('abcdefg', 'camera');
      manager.applyConstraints(source1, constraints)
      .then(() => {
        settings = source1.getSettings();
        assert.equal(settings.width, 1920);
        assert.equal(settings.height, 1080);
        assert.equal(settings.frameRate, 30);
        assert.equal(settings.aspectRatio, 16 / 9);

        constraints = {
          width: 640,
          height: 480,
          frameRate: 15,
          aspectRatio: 4 / 3
        };

        source2 = manager.attachSource('abcdefg', 'camera');
        manager.applyConstraints(source2, constraints)
        .then(() => {
          assert.equal(source1, source2);
          settings = source1.getSettings();
          assert.equal(settings.width, 640);
          assert.equal(settings.height, 480);
          assert.equal(settings.frameRate, 15);
          assert.equal(settings.aspectRatio, 4 / 3);
          settings = source2.getSettings();
          assert.equal(settings.width, 640);
          assert.equal(settings.height, 480);
          assert.equal(settings.frameRate, 15);
          assert.equal(settings.aspectRatio, 4 / 3);
          manager.detachSource('abcdefg');
          done();
        });
      });
    });
  });

  describe('addSink', function () {
    it('can manage multiple sink objects', function () {
      let source1, source2,
          sink1 = {enabled: true, onData: () => {}},
          sink2 = {enabled: true, onData: () => {}},
          dummyData = {dummy: true};

      sinon.spy(sink1, 'onData');
      sinon.spy(sink2, 'onData');

      source1 = manager.attachSource('track-id-001', 'camera');
      source2 = manager.attachSource('track-id-002', 'camera');
      manager.addSink('track-id-001', sink1);
      manager.addSink('track-id-002', sink2);
      manager.sources.get(Source.TYPE_CAMERA).forEach((camera) => {
        if (camera.deviceId === source1.deviceId ||
          camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      assert(sink1.onData.calledWith({data: dummyData}), true);
      assert(sink2.onData.calledWith({data: dummyData}), true);
      manager.enableSink('track-id-002', false);
      manager.sources.get(Source.TYPE_CAMERA).forEach((camera) => {
        if (camera.deviceId === source1.deviceId ||
          camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      assert(sink1.onData.calledWith({data: dummyData}), true);
      assert(sink2.onData.calledWith({data: null}), true);
      manager.removeSink('track-id-001', sink1);
      manager.removeSink('track-id-002', sink2);
      manager.sources.get(Source.TYPE_CAMERA).forEach((camera) => {
        if (camera.deviceId === source1.deviceId ||
          camera.deviceId === source2.deviceId) {
          camera.emit('data', dummyData);
        }
      });
      assert(sink1.onData.called, false);
      assert(sink2.onData.called, false);
      manager.detachSource('track-id-001');
      manager.detachSource('track-id-002');
    });
  });
});
