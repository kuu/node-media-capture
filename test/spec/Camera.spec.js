import Source from '../../src/Source';
import SourceManager from '../../src/SourceManager';
import Camera from '../../src/Camera';
import assert from 'power-assert';

/*global describe, it, beforeEach*/

describe('Camera', function () {

  var hal;
  var camera;

  beforeEach(function () {
    hal = SourceManager.getInstance().hal;
    camera = new Camera(hal, 'deviceId-01');
    void camera;
  });

  it('can be initialized with default options', function () {
    var c = new Camera(hal, 'deviceId-01');

    assert.equal(c.sourceType, Source.TYPE_CAMERA);
    assert.equal(c.deviceId, 'deviceId-01');
    assert.equal(c.groupId, void 0);
    assert.deepEqual(c.getCapabilities(), Camera.DEFAULT_CAPABILITY);
    assert.deepEqual(c.getSettings(), {
      width: Camera.DEFAULT_CAPABILITY.width.defaultSetting,
      height: Camera.DEFAULT_CAPABILITY.height.defaultSetting,
      frameRate: Camera.DEFAULT_CAPABILITY.frameRate.defaultSetting,
      aspectRatio: Camera.DEFAULT_CAPABILITY.aspectRatio.defaultSetting,
      facingMode: Camera.DEFAULT_CAPABILITY.facingMode.defaultSetting
    });
  });

  it('can be initialized with specific options', function () {
    var capability = {
      width: {min: 1, max: 9999, defaultSetting: 640},
      height: {min: 1, max: 9999, defaultSetting: 480},
      frameRate: {min: 1, max: 999, defaultSetting: 30},
      aspectRatio: {oneOf: [3 / 2, 4 / 3, 16 / 9], defaultSetting: 4 / 3},
      facingMode: {
        oneOf: [
          Camera.FACING_MODE_USER,
          Camera.FACING_MODE_ENVIRONMENT,
          Camera.FACING_MODE_LEFT,
          Camera.FACING_MODE_RIGHT
        ],
        defaultSetting: Camera.FACING_MODE_RIGHT
      }
    },
    c = new Camera(hal, 'deviceId-01', 'groupId-01', capability);

    assert.equal(c.sourceType, Source.TYPE_CAMERA);
    assert.equal(c.deviceId, 'deviceId-01');
    assert.equal(c.groupId, 'groupId-01');
    assert.deepEqual(c.getCapabilities(), capability);
    assert.deepEqual(c.getSettings(), {
      width: capability.width.defaultSetting,
      height: capability.height.defaultSetting,
      frameRate: capability.frameRate.defaultSetting,
      aspectRatio: capability.aspectRatio.defaultSetting,
      facingMode: capability.facingMode.defaultSetting
    });
  });

  it('can be reset with valid constraints', function () {
    var constraints, settings, ret, reason,
        defaultCapability = Camera.DEFAULT_CAPABILITY;

    settings = camera.getSettings();
    assert.equal(settings.width, defaultCapability.width.defaultSetting);
    assert.equal(settings.height, defaultCapability.height.defaultSetting);
    assert.equal(settings.aspectRatio, defaultCapability.aspectRatio.defaultSetting);

    constraints = {
      width: 1280,
      height: 720,
      aspectRatio: 16 / 9
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, true);
    settings = camera.getSettings();
    assert.equal(settings.width, 1280);
    assert.equal(settings.height, 720);
    assert.equal(settings.aspectRatio, 16 / 9);

    constraints = {
      width: {min: 640, ideal: 640},
      height: {min: 480, ideal: 480},
      aspectRatio: 4 / 3
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, true);
    settings = camera.getSettings();
    assert.equal(settings.width, 640);
    assert.equal(settings.height, 480);
    assert.equal(settings.aspectRatio, 4 / 3);

    constraints = {
      width: {exact: defaultCapability.width.min - 1}
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, false);
    assert.equal(reason, 'width');
    settings = camera.getSettings();
    assert.equal(settings.width, 640);

    constraints = {
      width: {exact: defaultCapability.width.max + 1}
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, false);
    assert.equal(reason, 'width');
    settings = camera.getSettings();
    assert.equal(settings.width, 640);

    constraints = {
      width: {ideal: defaultCapability.width.min - 1}
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, false);
    assert.equal(reason, 'width');
    settings = camera.getSettings();
    assert.equal(settings.width, 640);

    constraints = {
      width: {ideal: defaultCapability.width.max + 1}
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, false);
    assert.equal(reason, 'width');
    settings = camera.getSettings();
    assert.equal(settings.width, 640);

    constraints = {
      aspectRatio: 1.5
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, true);
    settings = camera.getSettings();
    assert.equal(settings.width, 720);
    assert.equal(settings.height, 480);
    assert.equal(settings.aspectRatio, 1.5);

    constraints = {
      width: 1080
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, true);
    settings = camera.getSettings();
    assert.equal(settings.width, 1080);
    assert.equal(settings.height, 720);
    assert.equal(settings.aspectRatio, 1.5);

    constraints = {
      height: 240
    };
    [ret, reason] = camera.applyConstraints(constraints);
    assert.equal(ret, true);
    settings = camera.getSettings();
    assert.equal(settings.width, 360);
    assert.equal(settings.height, 240);
    assert.equal(settings.aspectRatio, 1.5);
  });

  it('can be initialized with specific options', function () {
  });
});
