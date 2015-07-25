import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import navigator from '../../..';
import MediaRecorder from '../../src/MediaRecorder';
import Kontainer from 'kontainer-js';

let app = express(),
    port = process.env.PORT || 8080,
    BASE_DIR = path.join(__dirname, './');

app.use(express.static(BASE_DIR));

app.get('/reception', (req, res) => {
  res.sendFile(BASE_DIR + 'reception.html');
});

app.get('/entrance', (req, res) => {
  res.sendFile(BASE_DIR + 'entrance.html');
});

// Start server
function start() {
  console.log('Server listening on port %s', port);
  let server = app.listen(port);
  console.log("server pid %s listening on port %s in %s mode",
    process.pid,
    port,
    app.get('env')
  );
  return server;
}

if (require.main === module) {

  let http = start(),
      io = socketIO(http),
      recorder;

  io.on('connection', (socket) => {

    console.log('A client connected.');

    socket.on('disconnect', () => {
      console.log('A client disconnected.');
      if (recorder) {
        recorder.stop();
      }
    }); 

    socket.on('start', () => {
      console.log('\tcapture request');

      navigator.mediaDevices.getUserMedia({video: true})
      .then(
        (stream) => {
          recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (buf) => {
            console.log('----- Captured from the reception camera. size=' + buf.length);
            socket.emit('reception-camera', {data: buf});
          };
        },
        (e) => {
          throw e;
        }
      );

      socket.on('entrance-camera-raw', (data) => {
        console.log('----- Captured from the entrance camera. size=' + data.length);
        // TODO: compress
        socket.broadcast.emit('entrance-camera', {data: data});
      });

      socket.on('chat message', (msg) => {
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
      });
    });
  });
}
