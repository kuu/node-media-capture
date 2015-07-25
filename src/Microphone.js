import Source from './Source';

export default class Microphone extends Source {
  constructor(hal, deviceId, groupId, capabilities=Microphone.DEFAULT_CAPABILITY) {
    super(hal, Source.TYPE_MICROPHONE, deviceId, groupId, capabilities);
  }

}

Microphone.DEFAULT_CAPABILITY = {
  volume: {min: -1, max: 1, defaultValue: 0},
  sampleRate: {oneOf: [8000, 22050, 44100, 48000, 96000, 192000], defaultValue: 44100},
  sampleSize: {oneOf: [8, 12, 16, 24, 32], defaultValue: 16},
  channelCount: {oneOf: [1, 2, 5.1], defaultValue: 2},
  echoCancellation: {oneOf: [true, false], defaultValue: false}
};
