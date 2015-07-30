'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ = require('../../..');

var _2 = _interopRequireDefault(_);

var _srcImageCapture = require('../../src/ImageCapture');

var _srcImageCapture2 = _interopRequireDefault(_srcImageCapture);

var _powerAssert = require('power-assert');

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

var _powerAssert2 = _interopRequireDefault(_powerAssert);

describe('ImageCapture', function () {
  var videoTrack;

  beforeEach(function (done) {
    _2['default'].mediaDevices.getUserMedia({ video: true }).then(function (v) {
      videoTrack = v.getVideoTracks()[0];
      done();
    }, function (e) {
      throw e;
    });
  });

  afterEach(function () {
    videoTrack.stop();
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
    var cap = new _srcImageCapture2['default'](videoTrack);
    _powerAssert2['default'].equal(canWrite(cap, 'photoCapabilities'), false);
    _powerAssert2['default'].equal(canWrite(cap, 'videoStreamTrack'), false);
    _powerAssert2['default'].equal(canWrite(cap, 'previewStream'), false);
  });

  it('can revceive data', function (done) {
    var cap = new _srcImageCapture2['default'](videoTrack);
    cap.takePhoto().then(function (blob) {
      _powerAssert2['default'].notEqual(blob, null);
      done();
    }, function (e) {
      throw e;
    });
  });
});