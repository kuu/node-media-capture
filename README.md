# node-media-capture
Node.js implementation of the W3C Media Capture and Streams

##Features

Currently supports the following APIs:
* MediaStream
* MediaStreamTrack
* MediaDevices
* MediaRecorder (partially)
* ImageCapture (partially)

###Specs

* [Media Capture and Streams](http://w3c.github.io/mediacapture-main/)
* [MediaStream Recording](http://w3c.github.io/mediacapture-record/MediaRecorder.html)
* [Mediastream Image Capture](http://w3c.github.io/mediacapture-image/index.html)

####Difference from W3C APIs

* `MediaRecorder`'s `ondataavailable()` returns node's `Buffer` instead of `ArrayBuffer`.
* `ImageCapture`'s `takePhoto()` returns node's `Buffer` instead of `Blob`.

###Status

* Currently supports Mac OS X only. (tested on MBP + Yosemite.)
* Currently supports video tracks only. (audio is being implemented.)
* `MediaRecorder`'s recording operations (pause/resume) are not supported.
* `ImageCapture`'s settings are not supported.

##Install

_Note that only the Mac OS X is supported._

```
$ git clone git@github.com:kuu/node-media-capture.git
$ npm install
```

##Run

Run the sample app:

```
$ npm start
```

Go to http://localhost:8080/ with your browser.

##Usage

```js
import NMC from 'node-media-capture';

let navigator = NMC.navigator,
    MediaRecorder = NMC.MediaRecorder,
    ImageCapture = NMC.ImageCapture;

navigator.mediaDevices.getUserMedia({video: true})
.then(
  (stream) => {
    // Video capture
    let recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (buf) => {
      console.log('----- Video captured. size=' + buf.length);
    };

    // Image capture
    let capture = new ImageCapture(stream.getVideoTracks()[0]);
    capture.takePhoto().then((buf) => {
      console.log('----- Image captured. size=' + buf.length);
    });
  },
  (e) => {
    throw e;
  }
);
```

See the [specs](#specs) for the details.
