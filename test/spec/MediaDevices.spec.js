import MediaDevices from '../../src/MediaDevices';
import assert from 'power-assert';
import SourceManager from '../../src/SourceManager';

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
    let mediaDevices = new MediaDevices();
    mediaDevices.enumerateDevices()
    .then((list) => {
      assert.equal(list.length, 2);
      done();
    });
  });

  it('allows the application to set an event handler that will be executed when the set of media devices has changed', function (done) {
    let mediaDevices = new MediaDevices();
    mediaDevices.ondevicechange = () => {
      mediaDevices.ondevicechange = null;
      assert.ok(true);
      done();
    };
    SourceManager.getInstance().hal.emit('change', {});
  });

  it('fires a devicechange event when the set of available devices changed', function (done) {
    let mediaDevices = new MediaDevices();
    mediaDevices.addEventListener('devicechange', function f() {
      mediaDevices.removeEventListener('devicechange', f, false);
      assert.ok(true);
      done();
    }, false);
    SourceManager.getInstance().hal.emit('change', {});
  });

  it('allows the application to determine which constraints the User Agent recognizes', function (done) {
    let mediaDevices = new MediaDevices(),
        supportedConstraints = mediaDevices.getSupportedConstraints();

    assert.equal(supportedConstraints, SourceManager.getInstance().hal.supportedConstraints);
    done();
  });

  it('allows the application to obtain the local multimedia content', function (done) {
    let mediaDevices = new MediaDevices();

    mediaDevices.getUserMedia({video: true, audio: true})
    .then((stream) => {
      assert.notEqual(stream, null);
      let videoTracks = stream.getVideoTracks(),
          audioTracks = stream.getAudioTracks();

      assert.equal(videoTracks.length, 1);
      assert.equal(audioTracks.length, 1);
      videoTracks[0].stop();
      audioTracks[0].stop();
      done();
    });
  });
});
