import EventTarget from './EventTarget';
import SourceManager from './SourceManager';
import Util from './Util';

let privateData = new WeakMap();

export default class MediaStreamTrack extends EventTarget {
  static kindToSourceType(kind) {
    if (kind === 'video') {
      return 'camera';
    } else {
      return 'microphone';
    }
  }

  constructor (kind, label, id=Util.issueId('track-')) {
    let track, state;

    super();

    if (kind instanceof MediaStreamTrack) {
      track = kind;
      kind = track.kind;
      label = track.label;
    }

    this.constrants = track ? Util.copyObject(track.constraints) : null;
    this.onmute = null;
    this.onunmute = null;
    this.readonly = track ? track.readonly : true;
    this.remote = track ? track.remote : false;
    this.onended = null;
    this.onoverconstrained = null;

    let startedHandler = () => {
      let event = {type: 'unmute'};
      this.emit('unmute', event);
      if (typeof this.onunmute === 'function') {
        this.onunmute(event);
      }
    };

    let stoppedHandler = () => {
      let event = {type: 'mute'};
      this.emit('mute', event);
      if (typeof this.onmute === 'function') {
        this.onmute(event);
      }
    };

    let source = SourceManager.getInstance().attachSource(id, MediaStreamTrack.kindToSourceType(kind));

    let event = {type: 'ended'};

    if (!source) {
      state = 'ended';
      this.emit('ended', event);
    } else {
      source.addEventListener('started', startedHandler, false);
      source.addEventListener('stopped', stoppedHandler, false);

      if (track && track.readyState === 'ended') {
        state = 'ended';
        this.emit('ended', event);
        if (typeof this.onended === 'function') {
          this.onended(event);
        }
      } else {
        state = 'live';
        this.emit('started');
      }
    }

    privateData.set(this, {
      kind: kind,
      id: id,
      label: label,
      enabled: track ? track.enabled : true,
      readyState: state,
      source: source,
      startedHandler: startedHandler,
      stoppedHandler: stoppedHandler
    });
  }

  get kind() {
    return privateData.get(this).kind;
  }

  get id() {
    return privateData.get(this).id;
  }

  get label() {
    return privateData.get(this).label;
  }

  get enabled() {
    return privateData.get(this).enabled;
  }

  set enabled(value) {
    let v = !!value;

    if (privateData.get(this).enabled !== v) {
      privateData.get(this).enabled = v;
      if (this.source) {
        SourceManager.getInstance().enableSink(this.id, v);
      }
    }
  }

  get muted() {
    if (this.source && !this.source.stopped) {
      return false;
    }
    return true;
  }

  get readyState() {
    return privateData.get(this).readyState;
  }

  get source() {
    return privateData.get(this).source;
  }

  clone() {
    return new MediaStreamTrack(this);
  }

  stop() {
    let source = this.source;
    if (source) {
      source.removeEventListener('started', privateData.get(this).startedHandler, false);
      source.removeEventListener('stopped', privateData.get(this).stoppedHandler, false);
      SourceManager.getInstance().detachSource(this.id);
    }
    let event = {type: 'ended', error: null};
    privateData.get(this).source = null;
    privateData.get(this).readyState = 'ended';
    this.emit('ended', event);
    if (typeof this.onended === 'function') {
      this.onended(event);
    }
  }

  getCapabilities() {
    return this.source && this.source.getCapabilities();
  }

  getConstraints() {
    return this.constraints;
  }

  getSettings() {
    return this.source && this.source.getSettings();
  }

  applyConstraints(constraints) {
    if (!this.source) {
      return Promise.resolve();
    }
    return SourceManager.getInstance().applyConstraints(this.source, constraints)
    .then(
      (source) => {
        this.constraints = constraints;
        privateData.get(this).label = source.settings.label;
      },
      (e) => {
        var event = {type: 'overconstrained', error: e};
        this.emit('overconstrained', event);
        if (typeof this.onoverconstrained === 'function') {
          this.onoverconstrained(event);
        }
      }
    );
  }
}
