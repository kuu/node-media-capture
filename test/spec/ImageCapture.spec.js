import navigator from '../../..';
import ImageCapture from '../../src/ImageCapture';
import assert from 'power-assert';

/*global describe, it, beforeEach, afterEach*/

/*
[Constructor(MediaStreamTrack track)]
interface ImageCapture {
    readonly    attribute PhotoCapabilities photoCapabilities;
    readonly    attribute MediaStreamTrack  videoStreamTrack;
    readonly    attribute MediaStream       previewStream;
    Promise setOptions (PhotoSettings? photoSettings);
    Promise takePhoto ();
    Promise grabFrame ();
};
*/

describe('ImageCapture', function () {
  var videoTrack;

  beforeEach(function (done) {
    navigator.mediaDevices.getUserMedia({video: true})
    .then(
      (v) => {
        videoTrack = v.getVideoTracks()[0];
        done();
      },
      (e) => {
        throw e;
      }
    );
  });

  afterEach(function () {
    videoTrack.stop();
  });

  let canWrite = (obj, prop) => {
    let result = true;
    try {
      obj[prop] = {};
    } catch(e) {
      void e;
      result = false;
    }
    return result;
  };

  it('has readonly members', function () {
    let cap = new ImageCapture(videoTrack);
    assert.equal(canWrite(cap, 'photoCapabilities'), false);
    assert.equal(canWrite(cap, 'videoStreamTrack'), false);
    assert.equal(canWrite(cap, 'previewStream'), false);
  });

  it('can revceive data', function (done) {
    let cap = new ImageCapture(videoTrack);
    cap.takePhoto().then(
      (blob) => {
        assert.notEqual(blob, null);
        done();
      },
      (e) => {
        throw e;
      }
    );
  });
});
