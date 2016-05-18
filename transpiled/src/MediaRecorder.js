'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = require('./EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _SourceManager = require('./SourceManager');

var _SourceManager2 = _interopRequireDefault(_SourceManager);

var _kontainerJs = require('kontainer-js');

var _kontainerJs2 = _interopRequireDefault(_kontainerJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateData = new WeakMap();
var IsoBmff = _kontainerJs2.default.IsoBmff;
var MDAT_HEADER_SIZE = 8;

var Muxer = function () {
  function Muxer(buffer) {
    _classCallCheck(this, Muxer);

    this.buffer = buffer;
    this.sequenceNumber = 1;
    this.byteOffset = 0;
    this.timeOffset = 0;
    this.moofSize = 0;
  }

  _createClass(Muxer, [{
    key: 'getTrackBox',
    value: function getTrackBox(track, trackId) {
      var metadata = track.chunks[0].metadata,
          tkhd = track.type === 'video' ? IsoBmff.createElement('tkhd', { trackId: trackId, duration: 0, width: track.settings.width, height: track.settings.height }) : IsoBmff.createElement('tkhd', { trackId: trackId, duration: 0, volume: track.settings.volume }),
          hdlr = track.type === 'video' ? IsoBmff.createElement('hdlr', { handlerType: 'video', name: 'VideoHandler' }) : IsoBmff.createElement('hdlr', { handlerType: 'audio', name: 'AudioHandler' }),
          xmhd = track.type === 'video' ? IsoBmff.createElement('vmhd', null) : IsoBmff.createElement('smhd', null);

      return IsoBmff.createElement('trak', null, tkhd, IsoBmff.createElement('mdia', null, IsoBmff.createElement('mdhd', { timeScale: metadata.timeScale, duration: 0 }), hdlr, IsoBmff.createElement('minf', null, xmhd, IsoBmff.createElement('dinf', null, IsoBmff.createElement('dref', { entryCount: 1 }, IsoBmff.createElement('url ', { location: '' }))), IsoBmff.createElement('stbl', null, IsoBmff.createElement('stsd', { entryCount: 1 }, track.type === 'video' ? IsoBmff.createElement('avc1', { dataReferenceIndex: trackId, width: track.settings.width, height: track.settings.height, frameCount: 1 }, IsoBmff.createElement('avcC', {
        avcProfileIndication: 'baseline',
        profileCompatibility: {
          constraintSet0Flag: false,
          constraintSet1Flag: false,
          constraintSet2Flag: false
        },
        avcLevelIndication: 3,
        lengthSize: 4,
        sequenceParameterSets: [{ data: metadata.sps, length: metadata.sps.length }],
        pictureParameterSets: [{ data: metadata.pps, length: metadata.pps.length }]
      })) : null // TODO - AAC
      ), IsoBmff.createElement('stts', { entries: [] }), IsoBmff.createElement('stsc', null), IsoBmff.createElement('stsz', null), IsoBmff.createElement('stco', null)))));
    }
  }, {
    key: 'getTrackExtendsBox',
    value: function getTrackExtendsBox(track, trackId) {
      return IsoBmff.createElement('trex', {
        trackId: trackId,
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
  }, {
    key: 'getTrackFragmentBoxList',
    value: function getTrackFragmentBoxList(base, byteOffset) {
      var buffer = this.buffer;

      return buffer.tracks.map(function (track, i) {
        var firstChunk = track.chunks[0];
        var truns = track.chunks.map(function (chunk, j) {
          var trun = IsoBmff.createElement('trun', {
            dataOffset: j === 0 ? byteOffset : void 0, // the first trun needs to have the data-offset
            samples: chunk.metadata.samples,
            firstSampleFlags: {
              sampleDependsOn: 'unknown',
              sampleIsDependedOn: 'unknown',
              sampleHasRedundancy: 'unknown',
              samplePaddingValue: 0,
              sampleIsDifferenceSample: false,
              sampleDegradationPriority: 512
            }
          });
          byteOffset += chunk.data.length;
          return trun;
        });
        return IsoBmff.createElement.apply(IsoBmff, ['traf', null, IsoBmff.createElement('tfhd', {
          trackId: i + 1,
          //baseDataOffset: base,
          defaultSampleDuration: firstChunk.metadata.timeScale / track.settings.frameRate,
          defaultSampleSize: truns[0].props.samples[0].size,
          defaultSampleFlags: {
            sampleDependsOn: 'unknown',
            sampleIsDependedOn: 'unknown',
            sampleHasRedundancy: 'unknown',
            samplePaddingValue: 0,
            sampleIsDifferenceSample: false,
            sampleDegradationPriority: 257
          }
        }), IsoBmff.createElement('tfdt', { baseMediaDecodeTime: firstChunk.metadata.pts, version: 1 })].concat(_toConsumableArray(truns)));
      });
    }
  }, {
    key: 'getMediaDataBox',
    value: function getMediaDataBox() {
      var buffer = this.buffer,
          buffList = [],
          totalBuf = void 0;

      buffer.tracks.forEach(function (track) {
        track.chunks.forEach(function (chunk) {
          buffList.push(chunk.data);
        });
      });

      totalBuf = Buffer.concat(buffList);
      return IsoBmff.createElement('mdat', { data: totalBuf });
    }
  }, {
    key: 'getInitializationSegment',
    value: function getInitializationSegment() {
      var _this = this;

      var buffer = this.buffer,
          traks = buffer.tracks.map(function (track, i) {
        return _this.getTrackBox(track, i + 1);
      }),
          treks = buffer.tracks.map(function (track, i) {
        return _this.getTrackExtendsBox(track, i + 1);
      });

      return IsoBmff.createElement('file', null, IsoBmff.createElement('ftyp', { majorBrand: 'isom', minorVersion: 512, compatibleBrands: ['isom', 'iso2', 'avc1', 'iso6', 'mp41'] }), IsoBmff.createElement.apply(IsoBmff, ['moov', null, IsoBmff.createElement('mvhd', { duration: 0, creationTime: new Date(0), modificationTime: new Date(0), timeScale: 1000, nextTrackId: this.buffer.length + 1 })].concat(_toConsumableArray(traks), [IsoBmff.createElement.apply(IsoBmff, ['mvex', null].concat(_toConsumableArray(treks)))])));
    }
  }, {
    key: 'getMoofSize',
    value: function getMoofSize() {
      if (this.moofSize) {
        return this.moofSize;
      }

      var trafs = this.getTrackFragmentBoxList(0, 0),
          moof = IsoBmff.createElement.apply(IsoBmff, ['moof', null, IsoBmff.createElement('mfhd', { sequenceNumber: this.sequenceNumber })].concat(_toConsumableArray(trafs)));

      this.moofSize = _kontainerJs2.default.renderToBuffer(moof).length;
      return this.moofSize;
    }
  }, {
    key: 'getMediaSegment',
    value: function getMediaSegment() {
      var trafs = this.getTrackFragmentBoxList(this.byteOffset, this.getMoofSize() + MDAT_HEADER_SIZE);

      return IsoBmff.createElement('file', null, IsoBmff.createElement.apply(IsoBmff, ['moof', null, IsoBmff.createElement('mfhd', { sequenceNumber: this.sequenceNumber })].concat(_toConsumableArray(trafs))), this.getMediaDataBox());
    }
  }, {
    key: 'renderInitializationSegment',
    value: function renderInitializationSegment() {
      var buf = _kontainerJs2.default.renderToBuffer(this.getInitializationSegment());
      this.byteOffset += buf.length;
      return buf;
    }
  }, {
    key: 'renderMediaSegment',
    value: function renderMediaSegment() {
      var buf = _kontainerJs2.default.renderToBuffer(this.getMediaSegment());
      this.byteOffset += buf.length;
      this.sequenceNumber++;
      return buf;
    }
  }]);

  return Muxer;
}();

var Sink = function () {
  function Sink(recorder, trackId, enabled) {
    _classCallCheck(this, Sink);

    this.recorder = recorder;
    this.trackId = trackId;
    this.enabled = enabled;
  }

  _createClass(Sink, [{
    key: 'onData',
    value: function onData(data) {
      this.recorder.multiplex(this.trackId, data);
    }
  }]);

  return Sink;
}();

var MuxBuffer = function () {
  function MuxBuffer() {
    _classCallCheck(this, MuxBuffer);

    this.tracks = [];
  }

  _createClass(MuxBuffer, [{
    key: 'addTrack',
    value: function addTrack(type, settings) {
      return this.tracks.push({ type: type, settings: settings, chunks: [] }) - 1;
    }
  }, {
    key: 'pushData',
    value: function pushData(trackId, data) {
      this.tracks[trackId].chunks.push(data);
    }
  }, {
    key: 'canFlush',
    value: function canFlush() {
      return this.tracks.every(function (track) {
        return track.chunks.length > 0;
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.tracks.forEach(function (track) {
        track.chunks.length = 0;
      });
    }
  }, {
    key: 'length',
    get: function get() {
      return this.tracks.length;
    }
  }]);

  return MuxBuffer;
}();

var MediaRecorder = function (_EventTarget) {
  _inherits(MediaRecorder, _EventTarget);

  function MediaRecorder(stream, mimeType) {
    _classCallCheck(this, MediaRecorder);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(MediaRecorder).call(this));

    privateData.set(_this2, {
      stream: stream,
      mimeType: mimeType,
      state: 'inactive',
      buffer: null
    });
    _this2.onstart = null;
    _this2.onstop = null;
    _this2.ondataavailable = null;
    _this2.onpause = null;
    _this2.onresume = null;
    _this2.onerror = null;
    _this2.ignoreMutedMedia = false;
    _this2.initializationSegment = null;
    _this2.needToIssueAnInitializationSegment = true;

    var videoTracks = stream.getVideoTracks();
    var audioTracks = stream.getAudioTracks();
    var buffer = privateData.get(_this2).buffer = new MuxBuffer();
    var trackId = 0;

    videoTracks.forEach(function (videoTrack) {
      trackId = buffer.addTrack('video', videoTrack.source.settings);
      _SourceManager2.default.getInstance().addSink(videoTrack.id, new Sink(_this2, trackId, videoTrack.enabled));
    });

    audioTracks.forEach(function (audioTrack) {
      trackId = buffer.addTrack('audio', audioTrack.source.settings);
      _SourceManager2.default.getInstance().addSink(audioTrack.id, new Sink(_this2, trackId, audioTrack.enabled));
    });

    _this2.muxer = new Muxer(buffer);
    return _this2;
  }

  _createClass(MediaRecorder, [{
    key: 'multiplex',
    value: function multiplex(trackId, data) {
      /*
          let handler = this.ondataavailable;
          if (handler) {
            handler(data.data);
          }
      */
      var buffer = privateData.get(this).buffer;
      buffer.pushData(trackId, data);

      if (buffer.canFlush()) {
        var handler = this.ondataavailable;
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
  }, {
    key: 'start',
    value: function start(timeslice) {
      void timeslice;
    }
  }, {
    key: 'stop',
    value: function stop() {}
  }, {
    key: 'pause',
    value: function pause() {}
  }, {
    key: 'resume',
    value: function resume() {}
  }, {
    key: 'requestData',
    value: function requestData() {}
  }, {
    key: 'stream',
    get: function get() {
      return privateData.get(this).stream;
    }
  }, {
    key: 'mimeType',
    get: function get() {
      return privateData.get(this).mimeType;
    }
  }, {
    key: 'state',
    get: function get() {
      return privateData.get(this).state;
    }
  }], [{
    key: 'canRecordMimeType',
    value: function canRecordMimeType(mimeType) {
      return ['video/mp4', 'audio/mp4'].indexOf(mimeType) !== -1;
    }
  }]);

  return MediaRecorder;
}(_EventTarget3.default);

exports.default = MediaRecorder;