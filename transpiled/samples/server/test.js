'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ = require('../../..');

var _2 = _interopRequireDefault(_);

var navigator = _2['default'].navigator,
    MediaRecorder = _2['default'].MediaRecorder,
    recorder = undefined,
    buffer = new Buffer(0),
    i = 0;

navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = function (buf) {
    console.log('----- Captured from the FaceTime camera. size=' + buf.length);
    buffer = Buffer.concat([buffer, buf]);
    if (buffer.length > 256000) {
      _fs2['default'].writeFile('./mp4/file-' + i++ + '.mp4', buffer, function (e) {
        console.log('\tfile written. size=' + buffer.length);
        buffer.length = 0;
      });
    }
  };
}, function (e) {
  throw e;
});