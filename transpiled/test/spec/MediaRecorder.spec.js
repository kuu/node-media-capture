'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

var _ = require('../../..');

var _2 = _interopRequireDefault(_);

var navigator = _2['default'].navigator;
var MediaRecorder = _2['default'].MediaRecorder;

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
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (v) {
      stream = v;
      done();
    }, function (e) {
      throw e;
    });
  });

  afterEach(function () {
    var tracks = stream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
  });

  var canWrite = function canWrite(obj, prop) {
    var result = true;
    try {
      obj[prop] = {};
    } catch (e) {
      void e;
      result = false;
    }
    return result;
  };

  it('has readonly members', function () {
    var rec = new MediaRecorder(stream);
    _powerAssert2['default'].equal(canWrite(rec, 'stream'), false);
    _powerAssert2['default'].equal(canWrite(rec, 'mimeType'), false);
    _powerAssert2['default'].equal(canWrite(rec, 'state'), false);
    _powerAssert2['default'].equal(canWrite(rec, 'onstart'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'onstop'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'ondataavailable'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'onpause'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'onresume'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'onerror'), true);
    _powerAssert2['default'].equal(canWrite(rec, 'ignoreMuteMedia'), true);
  });

  it('can revceive data', function (done) {
    var rec = new MediaRecorder(stream);
    var i = 0;
    rec.ondataavailable = function (data) {
      console.log('Yay!', data);
      if (i++ > 5) {
        rec.ondataavailable = null;
        done();
      }
    };
  });
});