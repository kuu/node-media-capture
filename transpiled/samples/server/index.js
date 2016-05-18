'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _ = require('../../..');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var navigator = _2.default.navigator;
var MediaRecorder = _2.default.MediaRecorder;
var ImageCapture = _2.default.ImageCapture;

var app = (0, _express2.default)(),
    port = process.env.PORT || 8080,
    BASE_DIR = _path2.default.join(__dirname, './');

app.use(_express2.default.static(BASE_DIR));

app.get('/', function (req, res) {
  res.sendFile(BASE_DIR + 'index.html');
});

// Start server
function start() {
  console.log('Server listening on port %s', port);
  var server = app.listen(port);
  console.log("server pid %s listening on port %s in %s mode", process.pid, port, app.get('env'));
  return server;
}

if (require.main === module) {
  (function () {

    var http = start(),
        io = (0, _socket2.default)(http),
        recorder = void 0,
        capture = void 0;

    io.on('connection', function (socket) {

      console.log('A client connected.');

      socket.on('disconnect', function () {
        console.log('A client disconnected.');
        if (recorder) {
          recorder.stop();
        }
      });

      socket.on('start', function () {
        console.log('\tcapture request');

        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
          recorder = new MediaRecorder(stream);
          capture = new ImageCapture(stream.getVideoTracks()[0]);
          recorder.ondataavailable = function (buf) {
            console.log('----- Captured from the FaceTime camera. size=' + buf.length);
            socket.emit('node-camera', { data: buf });
          };
        }, function (e) {
          throw e;
        });

        socket.on('chat message', function (msg) {
          console.log('chat message: ' + msg);
          io.emit('chat message', msg);
        });

        socket.on('take photo', function () {
          console.log('take photo');
          capture.takePhoto().then(function (d) {
            console.log('\tphoto taken');
            io.emit('photo', { data: d });
          });
        });
      });
    });
  })();
}