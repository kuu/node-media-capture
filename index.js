MediaDevices = require('./transpiled/src/MediaDevices').default;
MediaRecorder = require('./transpiled/src/MediaRecorder').default;
ImageCapture = require('./transpiled/src/ImageCapture').default;

module.exports = {
  navigator: {
    mediaDevices: new MediaDevices()
  },
  MediaRecorder: MediaRecorder,
  ImageCapture: ImageCapture
};
