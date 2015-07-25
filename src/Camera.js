import Source from './Source';

export default class Camera extends Source {
  constructor(hal, deviceId, groupId, capabilities=Camera.DEFAULT_CAPABILITY) {
    super(hal, Source.TYPE_CAMERA, deviceId, groupId, capabilities);
  }

  mergeSettings(settings) {
    var aspectRatio, width, height, currentSettings;

    super.mergeSettings(settings);

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
}

Camera.FACING_MODE_USER = 'user';
Camera.FACING_MODE_ENVIRONMENT = 'environment';
Camera.FACING_MODE_LEFT = 'left';
Camera.FACING_MODE_RIGHT = 'right';

Camera.DEFAULT_CAPABILITY = {
  width: {min: 320, max: 1920, defaultValue: 640},
  height: {min: 240, max: 1080, defaultValue: 360},
  frameRate: {min: 1, max: 120, defaultValue: 15},
  aspectRatio: {oneOf: [3 / 2, 4 / 3, 16 / 9], defaultValue: 16 / 9},
  facingMode: {
    oneOf: [
      Camera.FACING_MODE_USER,
      Camera.FACING_MODE_ENVIRONMENT,
      Camera.FACING_MODE_LEFT,
      Camera.FACING_MODE_RIGHT
    ],
    defaultValue: Camera.FACING_MODE_USER
  }
};
