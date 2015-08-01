# node-media-capture
Node.js implementation of the W3C Media Capture and Streams

##Features

Currently supports the following APIs:
* MediaStream
* MediaStreamTrack
* MediaDevices
* MediaRecorder (partially)

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

##Install

###Mac OS X

####Install ffmpeg+libx264
In case you don't have Homebrew:

```
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

In case you don't have ffmpeg:

```
$ brew install ffmpeg --with-libfaac --with-libopenjpeg --with-openssl --with-libvo-aacenc --with-libx264
```

Make sure that the following libs are installed:

* /usr/local/lib/libavutil.a
* /usr/local/lib/libswscale.a
* /usr/local/lib/libx264.a

####Install npm dependencies:

```
$ npm install
```

##Run

Run the sample app:

```
$ npm start
```

With separate browsers:
* Go to http://localhost:8080/reception
* Go to http://localhost:8080/entrance

##Usage

See the [specs](http://w3c.github.io/mediacapture-main/) for the details.

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
