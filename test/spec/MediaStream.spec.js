import MediaStream from '../../src/MediaStream';
import MediaStreamTrack from '../../src/MediaStreamTrack';
import assert from 'power-assert';
import sinon from 'sinon';

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
    let stream = new MediaStream();
    assert.equal(canWrite(stream, 'id'), false);
    assert.equal(canWrite(stream, 'active'), false);
    assert.equal(canWrite(stream, 'onactive'), true);
    assert.equal(canWrite(stream, 'oninactive'), true);
    assert.equal(canWrite(stream, 'onaddtrack'), true);
    assert.equal(canWrite(stream, 'onremovetrack'), true);
  });

  it('can be created from an array of MediaStreamTrack objects', function () {
    let track1, track2, stream;
    track1 = new MediaStreamTrack('video', 'Internal Camera');
    track2 = new MediaStreamTrack('audio', 'Built-in microphone');
    stream = new MediaStream([track1, track2]);
    assert.equal(stream.getTrackById(track1.id), track1);
    assert.equal(stream.getTrackById(track2.id), track2);
    track1.stop();
    track2.stop();
  });

  it('can be created from an existing MediaStream object', function () {
    let track1, track2, stream1, stream2;
    track1 = new MediaStreamTrack('video', 'Internal Camera');
    track2 = new MediaStreamTrack('audio', 'Built-in microphone');

    stream1 = new MediaStream([track1, track2]);
    stream2 = new MediaStream(stream1);
    assert.equal(stream2.getTrackById(track1.id), track1);
    assert.equal(stream2.getTrackById(track2.id), track2);
    track1.stop();
    track2.stop();
  });

  it('can be cloned', function () {
    let track1, track2, track3, track4, stream1, stream2, tracks;
    track1 = new MediaStreamTrack('video', 'Internal Camera');
    track2 = new MediaStreamTrack('audio', 'Built-in microphone');

    stream1 = new MediaStream([track1, track2]);
    stream2 = stream1.clone();
    tracks = stream2.getTracks();
    assert.equal(tracks.length, 2);
    track3 = tracks[0];
    track4 = tracks[1];

    assert.notEqual(track3.id, track1.id);
    assert.notEqual(track4.id, track1.id);
    assert.notEqual(track3.id, track2.id);
    assert.notEqual(track4.id, track2.id);
    track1.stop();
    track2.stop();
    track3.stop();
    track4.stop();
  });

  it('is said to be active when it has at least one MediaStreamTrack that has not ended', function () {
    let track1, track2, stream1, stream2;
    track1 = new MediaStreamTrack('video', 'Internal Camera');
    track2 = new MediaStreamTrack('audio', 'Built-in microphone');
    stream1 = new MediaStream();
    assert.equal(stream1.active, false);

    stream1.addTrack(track1);
    assert.equal(stream1.active, true);

    stream1.removeTrack(track1);
    assert.equal(stream1.active, false);

    stream2 = new MediaStream([track1, track2]);
    assert.equal(stream2.active, true);

    track1.stop();
    assert.equal(stream2.active, true);
    track2.stop();
    assert.equal(stream2.active, false);
  });

  it('fires an active/inactive event when its active status changes', function () {
    let track1, track2, stream,
        obj1 = {handler: () => {}},
        obj2 = {handler: () => {}},
        handler1 = (e) => {
          stream.removeEventListener('active', handler1, false);
          obj1.handler(e);
        },
        handler2 = (e) => {
          stream.removeEventListener('inactive', handler2, false);
          obj2.handler(e);
        };


    sinon.spy(obj1, 'handler');
    sinon.spy(obj2, 'handler');

    track1 = new MediaStreamTrack('video', 'Internal Camera');
    track2 = new MediaStreamTrack('audio', 'Built-in microphone');
    stream = new MediaStream();
    stream.addEventListener('active', handler1, false);
    stream.addEventListener('inactive', handler2, false);
    assert.equal(obj1.handler.callCount, 0);
    assert.equal(obj2.handler.callCount, 0);

    stream.addTrack(track1);

    assert.equal(obj1.handler.callCount, 1);
    assert.equal(obj2.handler.callCount, 0);

    stream.addTrack(track2);

    assert.equal(obj1.handler.callCount, 1);
    assert.equal(obj2.handler.callCount, 0);

    track1.stop();
    assert.equal(obj1.handler.callCount, 1);
    assert.equal(obj2.handler.callCount, 0);
    track2.stop();
    assert.equal(obj1.handler.callCount, 1);
    assert.equal(obj2.handler.callCount, 1);
  });

  describe('addTrack', function () {
    it('ignores if the given track is already in the track set', function () {
      let track1, track2, stream, tracks;
      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1, track2]);
      tracks = stream.getTracks();
      assert.equal(tracks.length, 2);

      stream.addTrack(track2);

      assert.equal(tracks.length, 2);

      track1.stop();
      track2.stop();
    });

    it('fires an addtrack event when a new MediaStreamTrack has been added to the stream', function () {
      let track1, track2, stream,
          obj = {handler: () => {}},
          handler = (e) => {
            stream.removeEventListener('addtrack', handler, false);
            obj.handler(e);
          };

      sinon.spy(obj, 'handler');

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1]);
      stream.addEventListener('addtrack', handler, false);
      assert.equal(obj.handler.callCount, 0);

      stream.addTrack(track2);

      assert.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('allows the application to set an event handler that will be executed when a new MediaStreamTrack has been added to the stream', function () {
      let track1, track2, stream,
          obj = {handler: () => {}},
          handler = (e) => {
            stream.onaddtrack = null;
            obj.handler(e);
          };

      sinon.spy(obj, 'handler');

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1]);
      stream.onaddtrack = handler;
      assert.equal(obj.handler.callCount, 0);

      stream.addTrack(track2);

      assert.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('fires an removetrack event when a MediaStreamTrack has been removed from the stream', function () {
      let track1, track2, stream,
          obj = {handler: () => {}},
          handler = (e) => {
            stream.removeEventListener('removetrack', handler, false);
            obj.handler(e);
          };

      sinon.spy(obj, 'handler');

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1, track2]);
      stream.addEventListener('removetrack', handler, false);
      assert.equal(obj.handler.callCount, 0);

      stream.removeTrack(track2);

      assert.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });

    it('allows the application to set an event handler that will be executed when a new MediaStreamTrack has been removed from the stream', function () {
      let track1, track2, stream,
          obj = {handler: () => {}},
          handler = (e) => {
            stream.onremovetrack = null;
            obj.handler(e);
          };

      sinon.spy(obj, 'handler');

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1, track2]);
      stream.addEventListener('removetrack', handler, false);
      stream.onremovetrack = handler;
      assert.equal(obj.handler.callCount, 0);

      stream.removeTrack(track2);

      assert.equal(obj.handler.callCount, 1);

      track1.stop();
      track2.stop();
    });
  });

  describe('getXXXTracks', function () {
    it('can get video tracks', function () {
      let track1, track2, stream, tracks;

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1, track2]);
      tracks = stream.getVideoTracks();

      assert.equal(tracks.length, 1);
      assert.equal(tracks[0], track1);

      track1.stop();
      track2.stop();
    });

    it('can get audio tracks', function () {
      let track1, track2, stream, tracks;

      track1 = new MediaStreamTrack('video', 'Internal Camera');
      track2 = new MediaStreamTrack('audio', 'Built-in microphone');
      stream = new MediaStream([track1, track2]);
      tracks = stream.getAudioTracks();

      assert.equal(tracks.length, 1);
      assert.equal(tracks[0], track2);

      track1.stop();
      track2.stop();
    });
  });
});
