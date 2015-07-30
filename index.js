MediaDevices = require('./transpiled/src/MediaDevices');
MediaRecorder = require('./transpiled/src/MediaRecorder');
ImageCapture = require('./transpiled/src/ImageCapture');

module.exports = {
  navigator: {
    mediaDevices: new MediaDevices()
  },
  MediaRecorder: MediaRecorder,
  ImageCapture: ImageCapture
};
