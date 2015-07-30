import assert from 'power-assert';
import mediaCapture from '../../..';

let navigator = mediaCapture.navigator;
let MediaRecorder = mediaCapture.MediaRecorder;

/*global describe, it, beforeEach, afterEach*/

/*
[ Constructor (MediaStream stream, [TreatUndefinedAs=Missing] optional DOMString mimeType)]
interface MediaRecorder : EventTarget {
    readonly    attribute MediaStream        stream;
    readonly    attribute DOMString          mimeType;
    readonly    attribute RecordingStateEnum state;
                attribute EventHandler       onstart;
                attribute EventHandler       onstop;
                attribute EventHandler       ondataavailable;
                attribute EventHandler       onpause;
                attribute EventHandler       onresume;
                attribute EventHandler       onerror;
                attribute Boolean            ignoreMutedMedia;
    void             start (optional long timeslice);
    void             stop ();
    void             pause ();
    void             resume ();
    void             requestData ();
    static DOMString canRecordMimeType (DOMString mimeType);
};
*/

describe('MediaRecorder', function () {
  var stream;

  beforeEach(function (done) {
    navigator.mediaDevices.getUserMedia({video: true})
    .then(
      (v) => {
        stream = v;
        done();
      },
      (e) => {
        throw e;
      }
    );
  });

  afterEach(function () {
    let tracks = stream.getTracks();
    tracks.forEach((track) => {
      track.stop();
    });
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
    let rec = new MediaRecorder(stream);
    assert.equal(canWrite(rec, 'stream'), false);
    assert.equal(canWrite(rec, 'mimeType'), false);
    assert.equal(canWrite(rec, 'state'), false);
    assert.equal(canWrite(rec, 'onstart'), true);
    assert.equal(canWrite(rec, 'onstop'), true);
    assert.equal(canWrite(rec, 'ondataavailable'), true);
    assert.equal(canWrite(rec, 'onpause'), true);
    assert.equal(canWrite(rec, 'onresume'), true);
    assert.equal(canWrite(rec, 'onerror'), true);
    assert.equal(canWrite(rec, 'ignoreMuteMedia'), true);
  });

  it('can revceive data', function (done) {
    let rec = new MediaRecorder(stream);
    let i = 0;
    rec.ondataavailable = (data) => {
      console.log('Yay!', data);
      if (i++ > 5) {
        rec.ondataavailable = null;
        done();
      }
    };
  });
});
