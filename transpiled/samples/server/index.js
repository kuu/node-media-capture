'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _socketIo = require('socket.io');

var _socketIo2 = _interopRequireDefault(_socketIo);

var _ = require('../../..');

var _2 = _interopRequireDefault(_);

var navigator = _2['default'].navigator;
var MediaRecorder = _2['default'].MediaRecorder;

var app = (0, _express2['default'])(),
    port = process.env.PORT || 8080,
    BASE_DIR = _path2['default'].join(__dirname, './');

app.use(_express2['default']['static'](BASE_DIR));

app.get('/reception', function (req, res) {
  res.sendFile(BASE_DIR + 'reception.html');
});

app.get('/entrance', function (req, res) {
  res.sendFile(BASE_DIR + 'entrance.html');
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
        io = (0, _socketIo2['default'])(http),
        recorder = undefined;

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
          recorder.ondataavailable = function (buf) {
            console.log('----- Captured from the reception camera. size=' + buf.length);
            socket.emit('reception-camera', { data: buf });
          };
        }, function (e) {
          throw e;
        });

        socket.on('entrance-camera-raw', function (data) {
          console.log('----- Captured from the entrance camera. size=' + data.length);
          // TODO: compress
          socket.broadcast.emit('entrance-camera', { data: data });
        });

        socket.on('chat message', function (msg) {
          console.log('chat message: ' + msg);
          io.emit('chat message', msg);
        });
      });
    });
  })();
}