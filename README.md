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

###Details

* Currently supports Mac OS X only. (tested on MBP + Yesemite.)
* Currently supports video tracks only. (audio is being implemented.)
* Media streams are intended to be compressed in the native addon.

##Install

###Mac OS X

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

Install the dependencies:

```
$ npm install
```

##Run

Run the sample app (office interphone):

```
$ npm start
```

With separate browsers:
* Go to http://localhost:8080/reception
* Go to http://localhost:8080/entrance

##Usage

See the [spec](http://w3c.github.io/mediacapture-main/) for the details.

```js
import navigator from '../../..';
import MediaRecorder from '../../src/MediaRecorder';

navigator.mediaDevices.getUserMedia({video: true})
.then(
  (stream) => {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (buf) => {
      console.log('----- Captured from the FaceTime camera. size=' + buf.length);
    };
  },
  (e) => {
    throw e;
  }
);
```
