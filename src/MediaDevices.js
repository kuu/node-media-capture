import EventTarget from './EventTarget';
import MediaStream from './MediaStream';
import MediaStreamTrack from './MediaStreamTrack';
import MediaStreamError from './MediaStreamError';
import SourceManager from './SourceManager';
import Util from './Util';

export default class MediaDevices extends EventTarget {
  constructor () {
    super();
    this.ondevicechange = null;
    SourceManager.getInstance().addEventListener('devicechange', (e) => {
      this.emit('devicechange', e);
      if (typeof this.ondevicechange === 'function') {
        this.ondevicechange(e);
      }
    }, false);
  }

  enumerateDevices() {
    return Promise.resolve(SourceManager.getInstance().deviceInfoList);
  }

  getSupportedConstraints() {
    return SourceManager.getInstance().supportedConstraints;
  }

  getUserMedia(constraints) {
    let video = constraints.video,
        audio = constraints.audio,
        finalSet = [],
        addTrack = (track, c) => {
          if (typeof c === 'object') {
            return track.applyConstraints(c).then(() => {
              return track;
            });
          }
          return Promise.resolve(track);
        };

    if (!video && !audio) {
      Util.throwError(new MediaStreamError('NotSupportedError', 'Either "video" or "audio" should be specified.'));
    }

    if (video) {
      finalSet.push(addTrack(new MediaStreamTrack('video', null), video));
    }

    if (audio) {
      finalSet.push(addTrack(new MediaStreamTrack('audio', null), audio));
    }
    return Promise.all(finalSet).then((tracks) => {
      return new MediaStream(tracks);
    });
  }
}
