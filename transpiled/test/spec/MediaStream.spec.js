'use strict';

var _MediaStream = require('../../src/MediaStream');

var _MediaStream2 = _interopRequireDefault(_MediaStream);

var _MediaStreamTrack = require('../../src/MediaStreamTrack');

var _MediaStreamTrack2 = _interopRequireDefault(_MediaStreamTrack);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global describe, it*/

/*
[ Constructor,
 Constructor (MediaStream stream),
 Constructor (sequence<MediaStreamTrack> tracks)]
interface MediaStream : EventTarget {
    readonly    attribute DOMString    id;
    sequence<MediaStreamTrack> getAudioTracks ();
    sequence<MediaStreamTrack> getVideoTracks ();
    sequence<MediaStreamTrack> getTracks ();
    MediaStreamTrack?          getTrackById (DOMString trackId);
    void                       addTrack (MediaStreamTrack track);
    void                       removeTrack (MediaStreamTrack track);
    MediaStream                clone ();
    readonly    attribute boolean      active;
                attribute EventHandler onactive;
                attribute EventHandler oninactive;
                attribute EventHandler onaddtrack;
                attribute EventHandler onremovetrack;
};
*/

describe('MediaStream', function () {

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
    var stream = new _MediaStream2.default();
    _powerAssert2.default.equal(canWrite(stream, 'id'), false);
    _powerAssert2.default.equal(canWrite(stream, 'active'), false);
    _powerAssert2.default.equal(canWrite(stream, 'onactive'), true);
    _powerAssert2.default.equal(canWrite(stream, 'oninactive'), true);
    _powerAssert2.default.equal(canWrite(stream, 'onaddtrack'), true);
    _powerAssert2.default.equal(canWrite(stream, 'onremovetrack'), true);
  });

  it('can be created from an array of MediaStreamTrack objects', function () {
    var track1 = void 0,
        track2 = void 0,
        stream = void 0;
    track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
    track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
    stream = new _MediaStream2.default([track1, track2]);
    _powerAssert2.default.equal(stream.getTrackById(track1.id), track1);
    _powerAssert2.default.equal(stream.getTrackById(track2.id), track2);
    track1.stop();
    track2.stop();
  });

  it('can be created from an existing MediaStream object', function () {
    var track1 = void 0,
        track2 = void 0,
        stream1 = void 0,
        stream2 = void 0;
    track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
    track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');

    stream1 = new _MediaStream2.default([track1, track2]);
    stream2 = new _MediaStream2.default(stream1);
    _powerAssert2.default.equal(stream2.getTrackById(track1.id), track1);
    _powerAssert2.default.equal(stream2.getTrackById(track2.id), track2);
    track1.stop();
    track2.stop();
  });

  it('can be cloned', function () {
    var track1 = void 0,
        track2 = void 0,
        track3 = void 0,
        track4 = void 0,
        stream1 = void 0,
        stream2 = void 0,
        tracks = void 0;
    track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
    track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');

    stream1 = new _MediaStream2.default([track1, track2]);
    stream2 = stream1.clone();
    tracks = stream2.getTracks();
    _powerAssert2.default.equal(tracks.length, 2);
    track3 = tracks[0];
    track4 = tracks[1];

    _powerAssert2.default.notEqual(track3.id, track1.id);
    _powerAssert2.default.notEqual(track4.id, track1.id);
    _powerAssert2.default.notEqual(track3.id, track2.id);
    _powerAssert2.default.notEqual(track4.id, track2.id);
    track1.stop();
    track2.stop();
    track3.stop();
    track4.stop();
  });

  it('is said to be active when it has at least one MediaStreamTrack that has not ended', function () {
    var track1 = void 0,
        track2 = void 0,
        stream1 = void 0,
        stream2 = void 0;
    track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
    track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
    stream1 = new _MediaStream2.default();
    _powerAssert2.default.equal(stream1.active, false);

    stream1.addTrack(track1);
    _powerAssert2.default.equal(stream1.active, true);

    stream1.removeTrack(track1);
    _powerAssert2.default.equal(stream1.active, false);

    stream2 = new _MediaStream2.default([track1, track2]);
    _powerAssert2.default.equal(stream2.active, true);

    track1.stop();
    _powerAssert2.default.equal(stream2.active, true);
    track2.stop();
    _powerAssert2.default.equal(stream2.active, false);
  });

  it('fires an active/inactive event when its active status changes', function () {
    var track1 = void 0,
        track2 = void 0,
        stream = void 0,
        obj1 = { handler: function handler() {} },
        obj2 = { handler: function handler() {} },
        handler1 = function handler1(e) {
      stream.removeEventListener('active', handler1, false);
      obj1.handler(e);
    },
        handler2 = function handler2(e) {
      stream.removeEventListener('inactive', handler2, false);
      obj2.handler(e);
    };

    _sinon2.default.spy(obj1, 'handler');
    _sinon2.default.spy(obj2, 'handler');

    track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
    track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
    stream = new _MediaStream2.default();
    stream.addEventListener('active', handler1, false);
    stream.addEventListener('inactive', handler2, false);
    _powerAssert2.default.equal(obj1.handler.callCount, 0);
    _powerAssert2.default.equal(obj2.handler.callCount, 0);

    stream.addTrack(track1);

    _powerAssert2.default.equal(obj1.handler.callCount, 1);
    _powerAssert2.default.equal(obj2.handler.callCount, 0);

    stream.addTrack(track2);

    _powerAssert2.default.equal(obj1.handler.callCount, 1);
    _powerAssert2.default.equal(obj2.handler.callCount, 0);

    track1.stop();
    _powerAssert2.default.equal(obj1.handler.callCount, 1);
    _powerAssert2.default.equal(obj2.handler.callCount, 0);
    track2.stop();
    _powerAssert2.default.equal(obj1.handler.callCount, 1);
    _powerAssert2.default.equal(obj2.handler.callCount, 1);
  });

  describe('addTrack', function () {
    it('ignores if the given track is already in the track set', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          tracks = void 0;
      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1, track2]);
      tracks = stream.getTracks();
      _powerAssert2.default.equal(tracks.length, 2);

      stream.addTrack(track2);

      _powerAssert2.default.equal(tracks.length, 2);

      track1.stop();
      track2.stop();
    });

    it('fires an addtrack event when a new MediaStreamTrack has been added to the stream', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          obj = { handler: function handler() {} },
          handler = function handler(e) {
        stream.removeEventListener('addtrack', handler, false);
        obj.handler(e);
      };

      _sinon2.default.spy(obj, 'handler');

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1]);
      stream.addEventListener('addtrack', handler, false);
      _powerAssert2.default.equal(obj.handler.callCount, 0);

      stream.addTrack(track2);

      _powerAssert2.default.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('allows the application to set an event handler that will be executed when a new MediaStreamTrack has been added to the stream', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          obj = { handler: function handler() {} },
          handler = function handler(e) {
        stream.onaddtrack = null;
        obj.handler(e);
      };

      _sinon2.default.spy(obj, 'handler');

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1]);
      stream.onaddtrack = handler;
      _powerAssert2.default.equal(obj.handler.callCount, 0);

      stream.addTrack(track2);

      _powerAssert2.default.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('fires an removetrack event when a MediaStreamTrack has been removed from the stream', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          obj = { handler: function handler() {} },
          handler = function handler(e) {
        stream.removeEventListener('removetrack', handler, false);
        obj.handler(e);
      };

      _sinon2.default.spy(obj, 'handler');

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1, track2]);
      stream.addEventListener('removetrack', handler, false);
      _powerAssert2.default.equal(obj.handler.callCount, 0);

      stream.removeTrack(track2);

      _powerAssert2.default.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('allows the application to set an event handler that will be executed when a new MediaStreamTrack has been removed from the stream', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          obj = { handler: function handler() {} },
          handler = function handler(e) {
        stream.onremovetrack = null;
        obj.handler(e);
      };

      _sinon2.default.spy(obj, 'handler');

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1, track2]);
      stream.addEventListener('removetrack', handler, false);
      stream.onremovetrack = handler;
      _powerAssert2.default.equal(obj.handler.callCount, 0);

      stream.removeTrack(track2);

      _powerAssert2.default.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });
  });

  describe('getXXXTracks', function () {
    it('can get video tracks', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          tracks = void 0;

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1, track2]);
      tracks = stream.getVideoTracks();

      _powerAssert2.default.equal(tracks.length, 1);
      _powerAssert2.default.equal(tracks[0], track1);

      track1.stop();
      track2.stop();
    });

    it('can get audio tracks', function () {
      var track1 = void 0,
          track2 = void 0,
          stream = void 0,
          tracks = void 0;

      track1 = new _MediaStreamTrack2.default('video', 'Internal Camera');
      track2 = new _MediaStreamTrack2.default('audio', 'Built-in microphone');
      stream = new _MediaStream2.default([track1, track2]);
      tracks = stream.getAudioTracks();

      _powerAssert2.default.equal(tracks.length, 1);
      _powerAssert2.default.equal(tracks[0], track2);

      track1.stop();
      track2.stop();
    });
  });
});