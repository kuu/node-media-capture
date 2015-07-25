import EventTarget from './EventTarget';
import Util from './Util';

let privateData = new WeakMap();

// Private functions
function checkActive(stream, track) {
  let curr = privateData.get(stream).active,
      next = privateData.get(stream).tracks.some((t) => {
        return t.readyState === 'live';
      }),
      event = {track};

  if (curr !== next) {
    privateData.get(stream).active = next;
    if (next) {
      stream.emit('active', event);
    } else {
      stream.emit('inactive', event);
    }
  }
}

function addEndedHandler(stream, track) {
  let f = () => {
    try {
      privateData.get(stream).checkActive(stream, track);
    } catch (e) {
      console.log('WOW!', e);
    }
  };
  track.addEventListener('ended', f, false);
  return f;
}

function removeEndedHandler(track, f) {
  track.removeEventListener('ended', f, false);
}

export default class MediaStream extends EventTarget {
  constructor (param) {
    let tracks;

    super();

    if (!param) {
      tracks = [];
    } else if (param instanceof MediaStream) {
      tracks = param.getTracks();
    } else if (typeof param.length === 'number') {
      tracks = Array.prototype.slice.call(param, 0);
    }

    this.onactive = null;
    this.oninactive = null;
    this.onaddtrack = null;
    this.onremovetrack = null;

    let handlers = new WeakMap();

    privateData.set(this, {
      id: Util.issueId('stream-'),
      tracks,
      active: tracks.some((track) => {
        return track.readyState === 'live';
      }),
      endedHandlers: handlers,
      checkActive,
      addEndedHandler,
      removeEndedHandler
    });

    tracks.forEach((track) => {
      handlers.set(track, privateData.get(this).addEndedHandler(this, track));
    });
  }

  get id() {
    return privateData.get(this).id;
  }

  get active() {
    return privateData.get(this).active;
  }

  getTracks() {
    return privateData.get(this).tracks.slice(0);
  }

  clone() {
    let tracks = [];

    privateData.get(this).tracks.forEach((track) => {
      tracks.push(track.clone());
    });
    return new MediaStream(tracks);
  }

  getTrackById(id) {
    for (let track of privateData.get(this).tracks) {
      if (track.id === id) {
        return track;
      }
    }
    return null;
  }

  addTrack(track) {
    let tracks = privateData.get(this).tracks,
        event = {track}, handlers;

    if (tracks.indexOf(track) !== -1) {
      return;
    }
    tracks.push(track);
    privateData.get(this).checkActive(this, track);
    handlers = privateData.get(this).endedHandlers;
    handlers.set(track, privateData.get(this).addEndedHandler(this, track));
    this.emit('addtrack', event);
    if (typeof this.onaddtrack === 'function') {
      this.onaddtrack(event);
    }
  }

  removeTrack(track) {
    var tracks = privateData.get(this).tracks,
        index = tracks.indexOf(track),
        event = {track};

    if (index === -1) {
      return;
    }
    tracks.splice(index, 1);
    privateData.get(this).checkActive(this, track);
    privateData.get(this).removeEndedHandler(track, privateData.get(this).endedHandlers.get(track));
    this.emit('removetrack', event);
    if (typeof this.onremovetrack === 'function') {
      this.onremovetrack(event);
    }
  }

  getAudioTracks() {
    return privateData.get(this).tracks.filter((track) => {
      return track.kind === 'audio';
    });
  }

  getVideoTracks() {
    return privateData.get(this).tracks.filter((track) => {
      return track.kind === 'video';
    });
  }
}
