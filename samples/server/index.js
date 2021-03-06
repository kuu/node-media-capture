import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import mediaCapture from '../../..';

let navigator = mediaCapture.navigator;
let MediaRecorder = mediaCapture.MediaRecorder;
let ImageCapture = mediaCapture.ImageCapture;

let app = express(),
    port = process.env.PORT || 8080,
    BASE_DIR = path.join(__dirname, './');

app.use(express.static(BASE_DIR));

app.get('/', (req, res) => {
  res.sendFile(BASE_DIR + 'index.html');
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
      recorder, capture;

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
          capture = new ImageCapture(stream.getVideoTracks()[0]);
          recorder.ondataavailable = (buf) => {
            console.log('----- Captured from the FaceTime camera. size=' + buf.length);
            socket.emit('node-camera', {data: buf});
          };
        },
        (e) => {
          throw e;
        }
      );

      socket.on('chat message', (msg) => {
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
      });

      socket.on('take photo', () => {
        console.log('take photo');
        capture.takePhoto().then((d) => {
          console.log('\tphoto taken');
          io.emit('photo', {data: d});
        });
      });
    });
  });
}
