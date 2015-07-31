import EventTarget from './EventTarget';
import SourceManager from './SourceManager';
import Kontainer from 'kontainer-js';

let privateData = new WeakMap();
let IsoBmff = Kontainer.IsoBmff;
const MDAT_HEADER_SIZE = 8;

class Muxer {

  constructor(buffer) {
    this.buffer = buffer;
    this.sequenceNumber = 1;
    this.baseOffset = 0;
    this.moofSize = 0;
  }

  getTrackBox(track, trackId) {
    let metadata = track.frames[0].metadata,
        tkhd = track.type === 'video' ?
          IsoBmff.createElement('tkhd', {trackId, duration: 0, width: track.settings.width, height: track.settings.height}) :
          IsoBmff.createElement('tkhd', {trackId, duration: 0, volume: track.settings.volume}),
        hdlr = track.type === 'video' ?
          IsoBmff.createElement('hdlr', {handlerType: 'video', name: 'VideoHandler'}) :
          IsoBmff.createElement('hdlr', {handlerType: 'audio', name: 'AudioHandler'}),
        xmhd = track.type === 'video' ?
          IsoBmff.createElement('vmhd', null) :
          IsoBmff.createElement('smhd', null);

    return IsoBmff.createElement('trak', null,
      tkhd,
      IsoBmff.createElement('mdia', null,
        IsoBmff.createElement('mdhd', {timeScale: 3000, duration: 0}),
        hdlr,
        IsoBmff.createElement('minf', null,
          xmhd,
          IsoBmff.createElement('dinf', null,
            IsoBmff.createElement('dref', {entryCount: 1},
              IsoBmff.createElement('url ', {location: ''})
            )
          ),
          IsoBmff.createElement('stbl', null,
            IsoBmff.createElement('stsd', {entryCount: 1},
              track.type === 'video' ?
                IsoBmff.createElement('avc1', {dataReferenceIndex: trackId, width: track.settings.width, height: track.settings.height, frameCount: 1},
                  IsoBmff.createElement('avcC', {
                    avcProfileIndication: 'baseline',
                    profileCompatibility: {
                      constraintSet0Flag: false,
                      constraintSet1Flag: false,
                      constraintSet2Flag: false
                    },
                    avcLevelIndication: 3,
                    lengthSize: 4,
                    sequenceParameterSets: [{data: metadata.sps, length: metadata.sps.length}],
                    pictureParameterSets: [{data: metadata.pps, length: metadata.pps.length}]
                  })
                ) :
                null // TODO - AAC
            ),
            IsoBmff.createElement('stts', {entries: []}),
            IsoBmff.createElement('stsc', null),
            IsoBmff.createElement('stsz', null),
            IsoBmff.createElement('stco', null)
          )
        )
      )
    );
  }

  getTrackExtendsBox(track, trackId) {
    return IsoBmff.createElement('trex', {
      trackId,
      defaultSampleDescriptionIndex: trackId,
      defaultSampleDuration: 0,
      defaultSampleSize: 0,
      defaultSampleFlags: {
        sampleDependsOn: 'unknown',
        sampleIsDependedOn: 'unknown',
        sampleHasRedundancy: 'unknown',
        samplePaddingValue: 0,
        sampleIsDifferenceSample: false,
        sampleDegradationPriority: 0
      }
    });
  }

  getTrackFragmentBoxList(base, offset) {
    let buffer = this.buffer;

    return buffer.tracks.map((track, i) => {
      let truns = track.frames.map((frame, j) => {
        let trun = IsoBmff.createElement('trun', {
          dataOffset: j === 0 ? offset : void 0, // the first trun needs to have the data-offset
          samples: frame.metadata.samples,
          firstSampleFlags: {
              sampleDependsOn: 'unknown',
              sampleIsDependedOn: 'unknown',
              sampleHasRedundancy: 'unknown',
              samplePaddingValue: 0,
              sampleIsDifferenceSample: false,
              sampleDegradationPriority: 257
            }
          });
        offset += frame.data.length;
        return trun;
      });
      return IsoBmff.createElement('traf', null,
        IsoBmff.createElement(
          'tfhd',
          {
            trackId: i + 1,
            baseDataOffset: base,
            defaultSampleDuration: 100,
            defaultSampleSize: 0,
            defaultSampleFlags: {
              sampleDependsOn: 'unknown',
              sampleIsDependedOn: 'unknown',
              sampleHasRedundancy: 'unknown',
              samplePaddingValue: 0,
              sampleIsDifferenceSample: false,
              sampleDegradationPriority: 0
            }
          }
        ),
        IsoBmff.createElement('tfdt', {baseMediaDecodeTime: 0, version: 1}),
        ...truns
      );
    });
  }

  getMediaDataBox() {
    let buffer = this.buffer,
        buffList = [], totalBuf;

    buffer.tracks.forEach((track) => {
      track.frames.forEach((frame) => {
        buffList.push(frame.data);
      });
    });

    totalBuf = Buffer.concat(buffList);
    return IsoBmff.createElement('mdat', {data: totalBuf});
  }

  getInitializationSegment() {
    let buffer = this.buffer,
        traks = buffer.tracks.map((track, i) => this.getTrackBox(track, i + 1)),
        treks = buffer.tracks.map((track, i) => this.getTrackExtendsBox(track, i + 1));

    return IsoBmff.createElement('file', null,
      IsoBmff.createElement('ftyp', {majorBrand: 'isom', minorVersion: 512, compatibleBrands: ['isom', 'iso2', 'avc1', 'iso6', 'mp41']}),
      IsoBmff.createElement('moov', null,
        IsoBmff.createElement('mvhd', {duration: 0, creationTime: new Date(0), modificationTime: new Date(0), timeScale: 1000, nextTrackId: this.buffer.length + 1}),
        ...traks,
        IsoBmff.createElement('mvex', null,
          ...treks
        )
      )
    );
  }

  getMoofSize() {
    if (this.moofSize) {
      return this.moofSize;
    }

    let trafs = this.getTrackFragmentBoxList(0, 0),
        moof = IsoBmff.createElement('moof', null,
          IsoBmff.createElement('mfhd', {sequenceNumber: this.sequenceNumber}),
          ...trafs
        );

    this.moofSize = Kontainer.renderToBuffer(moof).length;
    return this.moofSize;
  }

  getMediaSegment() {
    let trafs = this.getTrackFragmentBoxList(this.baseOffset, this.getMoofSize() + MDAT_HEADER_SIZE);

    return IsoBmff.createElement('file', null,
      IsoBmff.createElement('moof', null,
        IsoBmff.createElement('mfhd', {sequenceNumber: this.sequenceNumber}),
        ...trafs
      ),
      this.getMediaDataBox()
    );
  }

  renderInitializationSegment() {
    let buf = Kontainer.renderToBuffer(this.getInitializationSegment());
    this.baseOffset += buf.length;
    return buf;
  }

  renderMediaSegment() {
    let buf = Kontainer.renderToBuffer(this.getMediaSegment());
    this.baseOffset += buf.length;
    this.sequenceNumber++;
    return buf;
  }
}

class Sink {
  constructor (recorder, trackId, enabled) {
    this.recorder = recorder;
    this.trackId = trackId;
    this.enabled = enabled;
  }

  onData(data) {
    this.recorder.multiplex(this.trackId, data);
  }
}

class MuxBuffer {
  constructor () {
    this.tracks = [];
  }

  addTrack(type, settings) {
    return this.tracks.push({type, settings, frames: []}) - 1;
  }

  pushData(trackId, data) {
    this.tracks[trackId].frames.push(data);
  }

  canFlush() {
    return this.tracks.every((track) => (track.frames.length > 0));
  }

  clear() {
    this.tracks.forEach((track) => {
      track.frames.length = 0;
    });
  }

  get length() {
    return this.tracks.length;
  }
}

export default class MediaRecorder extends EventTarget {
  constructor (stream, mimeType) {
    super();
    privateData.set(this, {
      stream: stream,
      mimeType: mimeType,
      state: 'inactive',
      buffer: null
    });
    this.onstart = null;
    this.onstop = null;
    this.ondataavailable = null;
    this.onpause = null;
    this.onresume = null;
    this.onerror = null;
    this.ignoreMutedMedia = false;
    this.initializationSegment = null;
    this.needToIssueAnInitializationSegment = true;

    let videoTracks = stream.getVideoTracks();
    let audioTracks = stream.getAudioTracks();
    let buffer = privateData.get(this).buffer = new MuxBuffer();
    let trackId = 0;

    videoTracks.forEach((videoTrack) => {
      trackId = buffer.addTrack('video', videoTrack.source.settings);
      SourceManager.getInstance().addSink(videoTrack.id, new Sink(this, trackId, videoTrack.enabled));
    });

    audioTracks.forEach((audioTrack) => {
      trackId = buffer.addTrack('audio', audioTrack.source.settings);
      SourceManager.getInstance().addSink(audioTrack.id, new Sink(this, trackId, audioTrack.enabled));
    });

    this.muxer = new Muxer(buffer);
  }

  multiplex(trackId, data) {
/*
    let handler = this.ondataavailable;
    if (handler) {
      handler(data.data);
    }
*/
    let buffer = privateData.get(this).buffer;
    buffer.pushData(trackId, data);

    if (buffer.canFlush()) {
      let handler = this.ondataavailable;
      if (handler) {
        if (this.needToIssueAnInitializationSegment) {
          this.initializationSegment = this.muxer.renderInitializationSegment();
          handler(this.initializationSegment);
          this.needToIssueAnInitializationSegment = false;
        }
        handler(this.muxer.renderMediaSegment());
      }
      buffer.clear();
    }
  }

  get stream() {
    return privateData.get(this).stream;
  }

  get mimeType() {
    return privateData.get(this).mimeType;
  }

  get state() {
    return privateData.get(this).state;
  }

  start(timeslice) {
    void timeslice;
  }

  stop() {
  }

  pause () {
  }

  resume() {
  }

  requestData() {
  }

  static canRecordMimeType(mimeType) {
    return ['video/mp4', 'audio/mp4'].indexOf(mimeType) !== -1;
  }
}
