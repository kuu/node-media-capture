import fs from 'fs';
import mediaCapture from '../../..';

let navigator = mediaCapture.navigator,
    MediaRecorder = mediaCapture.MediaRecorder,
    recorder, buffer = new Buffer(0), i = 0;

navigator.mediaDevices.getUserMedia({video: true})
.then(
  (stream) => {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (buf) => {
      console.log('----- Captured from the FaceTime camera. size=' + buf.length);
      buffer = Buffer.concat([buffer, buf]);
      if (buffer.length > 256000) {
        fs.writeFile(`./mp4/file-${i++}.mp4`, buffer, (e) => {
          console.log('\tfile written. size=' + buffer.length);
          buffer.length = 0;
        });
      }
    };
  },
  (e) => {
    throw e;
  }
);
