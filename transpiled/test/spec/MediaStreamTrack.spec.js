'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _srcMediaStreamTrack = require('../../src/MediaStreamTrack');

var _srcMediaStreamTrack2 = _interopRequireDefault(_srcMediaStreamTrack);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

/*global describe, it, beforeEach, afterEach*/

/*
interface MediaStreamTrack : EventTarget {
    readonly    attribute DOMString             kind;
    readonly    attribute DOMString             id;
    readonly    attribute DOMString             label;
*                attribute boolean               enabled;
    readonly    attribute boolean               muted;
                attribute EventHandler          onmute;
                attribute EventHandler          onunmute;
    readonly    attribute boolean               _readonly;
    readonly    attribute boolean               remote;
    readonly    attribute MediaStreamTrackState readyState;
                attribute EventHandler          onended;
    MediaStreamTrack       clone ();
*    void                   stop ();
    MediaTrackCapabilities getCapabilities ();
    MediaTrackConstraints  getConstraints ();
    MediaTrackSettings     getSettings ();
    Promise<void>          applyConstraints (MediaTrackConstraints constraints);
                attribute EventHandler          onoverconstrained;
};
*/

describe('MediaStreamTrack', function () {

  var track;

  beforeEach(function () {
    track = new _srcMediaStreamTrack2['default']('video', 'Internal Camera');
  });

  afterEach(function () {
    track.stop();
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
    _powerAssert2['default'].equal(canWrite(track, 'kind'), false);
    _powerAssert2['default'].equal(canWrite(track, 'id'), false);
    _powerAssert2['default'].equal(canWrite(track, 'label'), false);
    _powerAssert2['default'].equal(canWrite(track, 'enabled'), true);
    _powerAssert2['default'].equal(canWrite(track, 'muted'), false);
    _powerAssert2['default'].equal(canWrite(track, 'onmute'), true);
    _powerAssert2['default'].equal(canWrite(track, 'onunmute'), true);
    _powerAssert2['default'].equal(canWrite(track, 'readyState'), false);
    _powerAssert2['default'].equal(canWrite(track, 'onended'), true);
    _powerAssert2['default'].equal(canWrite(track, 'onoverconstrained'), true);
  });

  it('can share the same media source with other MediaStreamTrack objects', function () {
    var track2 = new _srcMediaStreamTrack2['default']('video', 'Internal Camera');
    _powerAssert2['default'].equal(track2.source, track.source);
    track2.stop();
  });

  it('inherits the state of the original track from which it is cloned', function () {
    var track2, track3;

    track2 = track.clone();
    _powerAssert2['default'].equal(track2.readyState, track.readyState);
    track2.stop();
    _powerAssert2['default'].notEqual(track2.readyState, track.readyState);
    track3 = track2.clone();
    _powerAssert2['default'].equal(track3.readyState, track2.readyState);
    track3.stop();
  });

  describe('MediaStreamTrack.stop()', function () {
    it('makes the source detached', function () {
      track.stop();
      _powerAssert2['default'].equal(track.source, null);
    });

    /*
        it('makes the source stopped if no other track is using the same source', function (done) {
          var track1, track2, source;
          track1 = new MediaStreamTrack('audio', 'Built-in microphone');
          source = track1.source;
          track2 = new MediaStreamTrack('audio', 'Built-in microphone');
          assert.equal(source.stopped, false);
          track1.stop();
          assert.equal(source.stopped, false);
          track2.stop();
          source.addEventListener('stopped', function f() {
            source.removeEventListener('stopped', f, false);
            assert.equal(source.stopped, true);
            done();
          }, false);
        });
    */
  });

  describe('MediaStreamTrack.enabled', function () {
    it('must return the value to which it was last set', function () {
      var isEnabled = track.enabled;
      track.enabled = !isEnabled;
      _powerAssert2['default'].notEqual(track.enabled, isEnabled);
    });

    it('is always true when the track is created, unless the track is cloned from a disabled track', function () {
      var track2;
      _powerAssert2['default'].equal(track.enabled, true);
      track.enabled = false;
      track2 = track.clone();
      _powerAssert2['default'].equal(track2.enabled, false);
      track2.stop();
    });

    it('must be set to the new value, regardless of whether the MediaStreamTrack object has been detached from its source or not', function () {
      var isEnabled = track.enabled;
      track.stop();
      track.enabled = !isEnabled;
      _powerAssert2['default'].notEqual(track.enabled, isEnabled);
    });

    it('renders silence when the value is false and the kind of the track is "audio"', function () {});

    it('renders black frames when the value is false and the kind of the track is "video"', function () {});
  });

  describe('MediaStreamTrack.muted', function () {
    /*
        it('reflects the state of the source', function () {
          let track2;
          assert.equal(track.muted, false);
          track2 = track.clone();
          assert.equal(track2.muted, false);
          track.source.stop();
          assert.equal(track.muted, true);
          assert.equal(track2.muted, true);
          track2.stop();
        });
    */

    it('renders silence when the value is true and the kind of the track is "audio"', function () {});

    it('renders black frames when the value is true and the kind of the track is "video"', function () {});

    /*
        it('can set "onmute" callback', function () {
          let track2 = track.clone(),
              obj = {handler: () => {}},
              handler1 = (e) => {
                track.onmute = null;
                obj.handler(e);
              },
              handler2 = (e) => {
                track2.onmute = null;
                obj.handler(e);
              };
    
          sinon.spy(obj, 'handler');
          track.onmute = handler1;
          track2.onmute = handler2;
    
          track.source.stop();
          track2.stop();
          assert.equal(obj.handler.callCount, 2);
        });
    */

    it('fires "mute" event when its value changes from false to true', function () {
      var track2 = track.clone(),
          obj = { handler: function handler() {} },
          handler1 = function handler1(e) {
        track.removeEventListener('mute', handler1, false);
        obj.handler(e);
      },
          handler2 = function handler2(e) {
        track2.removeEventListener('mute', handler2, false);
        obj.handler(e);
      };

      _sinon2['default'].spy(obj, 'handler');
      track.addEventListener('mute', handler1, false);
      track2.addEventListener('mute', handler2, false);

      track.source.stop();
      track2.stop();
      _powerAssert2['default'].equal(obj.handler.callCount, 2);
    });

    it('can set "onunmute" callback', function () {
      var track2 = track.clone(),
          obj = { handler: function handler() {} },
          handler1 = function handler1(e) {
        track.onunmute = null;
        obj.handler(e);
      },
          handler2 = function handler2(e) {
        track2.onunmute = null;
        obj.handler(e);
      };

      _sinon2['default'].spy(obj, 'handler');
      track.onunmute = handler1;
      track2.onunmute = handler2;

      track.source.stop();
      track.source.start();
      track2.stop();
      _powerAssert2['default'].equal(obj.handler.callCount, 2);
    });

    it('fires "unmute" event when its value changes from true to false', function () {
      var track2 = track.clone(),
          obj = { handler: function handler() {} },
          handler1 = function handler1(e) {
        track.removeEventListener('unmute', handler1, false);
        obj.handler(e);
      },
          handler2 = function handler2(e) {
        track2.removeEventListener('unmute', handler2, false);
        obj.handler(e);
      };

      _sinon2['default'].spy(obj, 'handler');
      track.addEventListener('unmute', handler1, false);
      track2.addEventListener('unmute', handler2, false);

      track.source.stop();
      track.source.start();
      track2.stop();
      _powerAssert2['default'].equal(obj.handler.callCount, 2);
    });
  });

  describe('MediaStreamTrack.enabled/muted', function () {

    it('notifies all clients to turn off the "On-Air" or "Recording" indicator for that source when all tracks connected to a source are muted or disabled', function () {});

    it('notifies all clients to turn back on the "On-Air" or "Recording" indicator for that source when any track is no longer muted or disabled', function () {});
  });

  describe('MediaStreamTrack.kind', function () {
    it('must not change values when the source is detached', function () {});
  });

  describe('MediaStreamTrack.label', function () {
    it('must not change values when the source is detached', function () {});
  });

  describe('MediaStreamTrack.clone()', function () {
    it('returns an object with a newly generated id', function () {});

    it('copies the source, kind, label, readyState, and enabled attributes, as well as its currently active constraints from the original track', function () {});
  });

  describe('MediaStreamTrack.applyConstraints()', function () {
    it('can change hardware configuration', function (done) {
      var constraints = {
        width: 1080,
        height: 720,
        aspectRatio: 1.5
      };

      track.applyConstraints(constraints).then(function () {
        _powerAssert2['default'].equal(track.source.settings.width, constraints.width);
        _powerAssert2['default'].equal(track.source.settings.height, constraints.height);
        _powerAssert2['default'].equal(track.source.settings.aspectRatio, constraints.aspectRatio);
        done();
      });
    });

    it('can set "onoverconstrained" callback', function (done) {
      var constraints = {
        width: 1080,
        height: 0,
        aspectRatio: 1.5
      };

      track.onoverconstrained = function (event) {
        var e = event.error;
        track.onoverconstrained = null;
        _powerAssert2['default'].equal(e.name, 'OverconstrainedError');
        _powerAssert2['default'].equal(e.constraintName, 'height');
        done();
      };
      track.applyConstraints(constraints);
    });

    it('can throw an "overconstrained" error', function (done) {
      var constraints = {
        width: 1080,
        height: 720,
        aspectRatio: 1.4
      };

      track.applyConstraints(constraints);
      track.addEventListener('overconstrained', function f1(event) {
        var e = event.error;
        track.removeEventListener('overconstrained', f1, false);
        _powerAssert2['default'].equal(e.name, 'OverconstrainedError');
        _powerAssert2['default'].equal(e.constraintName, 'aspectRatio');
        done();
      }, false);
    });
  });

  describe('MediaStreamTrack.getCapabilities()', function () {
    it('can retrieve the capability', function () {
      var capabilities = track.getCapabilities();
      _powerAssert2['default'].equal(capabilities.width.max, 1920);
      _powerAssert2['default'].equal(capabilities.height.max, 1080);
    });
  });

  describe('MediaStreamTrack.getConstraints()', function () {
    it('can retrieve the current constraints', function (done) {
      var constraintsToSet = {
        width: 1080,
        height: 720,
        aspectRatio: 1.5
      },
          constraints = track.getConstraints();
      _powerAssert2['default'].equal(constraints, null);

      track.applyConstraints(constraintsToSet).then(function () {
        constraints = track.getConstraints();
        _powerAssert2['default'].notEqual(constraints, null);
        _powerAssert2['default'].equal(constraints.width, constraintsToSet.width);
        _powerAssert2['default'].equal(constraints.height, constraintsToSet.height);
        _powerAssert2['default'].equal(constraints.aspectRatio, constraintsToSet.aspectRatio);
        done();
      }, function (e) {
        console.log(e);
      });
    });
  });

  describe('MediaStreamTrack.getSettings()', function () {
    it('can retrieve the current settings', function (done) {
      var constraints = {
        width: 960,
        height: 640,
        aspectRatio: 1.5
      },
          settings;

      track.applyConstraints(constraints).then(function () {
        settings = track.getSettings();
        _powerAssert2['default'].equal(settings.width, constraints.width);
        _powerAssert2['default'].equal(settings.height, constraints.height);
        done();
      });
    });
  });

  it('can set "onended" callback', function () {
    var track2 = track.clone(),
        obj = { handler: function handler() {} },
        handler = function handler(e) {
      track2.onended = null;
      obj.handler(e);
    };

    track2.onended = handler;
    track2.stop();
  });

  it('should not throw an exception even when it is in "ended" state', function (done) {
    track.stop();
    _powerAssert2['default'].equal(track.readyState, 'ended');
    try {
      var v = undefined;
      v = track.kind;
      v = track.id;
      v = track.label;
      v = track.enabled;
      v = track.muted;
      v = track.readyState;
      v = track.getCapabilities();
      v = track.getConstraints();
      v = track.getSettings();
      void v;
    } catch (e) {
      throw new Error('Exception occurred by accessing ended track. ', e);
    }
    done();
  });

  it('cannot be affected by anything when it is in "ended" state', function (done) {
    track.stop();
    _powerAssert2['default'].equal(track.readyState, 'ended');
    try {
      var v = undefined;
      v = track.enabled;
      track.enabled = !v;
      _powerAssert2['default'].equal(track.enabled, !v); // should change!
      v = track.onmute;
      track.onmute = function () {};
      v = track.onunmute;
      track.onunmute = function () {};
      v = track.onended;
      track.onended = function () {};
      v = track.onoverconstrained;
      track.onoverconstrained = function () {};
      v = track.clone();
      track.stop();
      track.applyConstraints({}).then(done);
    } catch (e) {
      throw new Error('Exception occurred by accessing ended track. ', e);
    }
  });
});