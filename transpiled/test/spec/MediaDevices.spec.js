'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _srcMediaDevices = require('../../src/MediaDevices');

var _srcMediaDevices2 = _interopRequireDefault(_srcMediaDevices);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

var _srcSourceManager = require('../../src/SourceManager');

var _srcSourceManager2 = _interopRequireDefault(_srcSourceManager);

/*global describe, it*/

/*
interface MediaDevices : EventTarget {
                attribute EventHandler ondevicechange;
    Promise<sequence<MediaDeviceInfo>> enumerateDevices ();
};

partial interface MediaDevices {
    MediaTrackSupportedConstraints getSupportedConstraints ();
    Promise<MediaStream>           getUserMedia (MediaStreamConstraints constraints);
};
*/

describe('MediaDevices', function () {
  it('can collect information about the available media input and output devices', function (done) {
    var mediaDevices = new _srcMediaDevices2['default']();
    mediaDevices.enumerateDevices().then(function (list) {
      _powerAssert2['default'].equal(list.length, 2);
      done();
    });
  });

  it('allows the application to set an event handler that will be executed when the set of media devices has changed', function (done) {
    var mediaDevices = new _srcMediaDevices2['default']();
    mediaDevices.ondevicechange = function () {
      mediaDevices.ondevicechange = null;
      _powerAssert2['default'].ok(true);
      done();
    };
    _srcSourceManager2['default'].getInstance().hal.emit('change', {});
  });

  it('fires a devicechange event when the set of available devices changed', function (done) {
    var mediaDevices = new _srcMediaDevices2['default']();
    mediaDevices.addEventListener('devicechange', function f() {
      mediaDevices.removeEventListener('devicechange', f, false);
      _powerAssert2['default'].ok(true);
      done();
    }, false);
    _srcSourceManager2['default'].getInstance().hal.emit('change', {});
  });

  it('allows the application to determine which constraints the User Agent recognizes', function (done) {
    var mediaDevices = new _srcMediaDevices2['default'](),
        supportedConstraints = mediaDevices.getSupportedConstraints();

    _powerAssert2['default'].equal(supportedConstraints, _srcSourceManager2['default'].getInstance().hal.supportedConstraints);
    done();
  });

  it('allows the application to obtain the local multimedia content', function (done) {
    var mediaDevices = new _srcMediaDevices2['default']();

    mediaDevices.getUserMedia({ video: true, audio: true }).then(function (stream) {
      _powerAssert2['default'].notEqual(stream, null);
      var videoTracks = stream.getVideoTracks(),
          audioTracks = stream.getAudioTracks();

      _powerAssert2['default'].equal(videoTracks.length, 1);
      _powerAssert2['default'].equal(audioTracks.length, 1);
      videoTracks[0].stop();
      audioTracks[0].stop();
      done();
    });
  });
});