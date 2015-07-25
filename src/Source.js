import EventTarget from './EventTarget';
import Util from './Util';

export default class Source extends EventTarget {
  constructor(hal, sourceType, deviceId, groupId, capabilities) {
    var settings;
    super();
    this.hal = hal;
    this.sourceType = sourceType;
    this.deviceId = deviceId;
    this.groupId = groupId;
    this.capabilities = capabilities;
    settings = this.settings = {};
    Object.keys(capabilities).forEach(key => {
      settings[key] = capabilities[key].defaultValue;
    });
    this.stopped = true;
    this.refs = new Set();
  }

  init() {
    // Initialize hardware
    return this.hal.initDevice(this.deviceId, this.settings);
  }

  reference(trackId) {
    let refs = this.refs;
    //console.log('###reference type=' + this.sourceType + ', trackId=' + trackId + ', refs=' + refs.size);
    if (refs.has(trackId)) {
      return this;
    }
    refs.add(trackId);
    if (this.stopped) {
      //console.log('\tstart! trackId=' + trackId);
      this.start();
    }
    return this;
  }

  dereference(trackId) {
    let refs = this.refs;
    //console.log('###dereference type=' + this.sourceType + ', trackId=' + trackId + ', refs=' + refs.size);
    if (!refs.has(trackId)) {
      return this;
    }
    refs.delete(trackId);
    if (refs.size === 0) {
      //console.log('\tstop! trackId=' + trackId);
      this.stop();
    }
    return this;
  }

  start() {
    if (!this.stopped) {
      return;
    }
    this.hal.startDevice(this.deviceId, this.onData.bind(this));
    this.stopped = false;
    this.emit('started');
  }

  stop() {
    if (this.stopped) {
      return;
    }
    this.hal.stopDevice(this.deviceId);
    this.stopped = true;
    this.emit('stopped');
  }

  update() {
    if (!this.stopped) {
      this.hal.configureDevice(this.deviceId, this.settings);
    }
  }

  onData(data) {
    this.emit('data', data);
  }

  getCapabilities() {
    return Util.copyObject(this.capabilities);
  }

  getSettings() {
    return Util.copyObject(this.settings);
  }

  mergeSettings(settings) {
    var current = this.settings;
    Object.keys(settings).forEach(key => {
      current[key] = settings[key];
    });
  }

  applyConstraints(constraints) {
    var pass, capabilities = this.capabilities, settings = {},
        errorReason = '';

    pass = Object.keys(constraints).every(key => {
      var requirement, proposed, result;

      requirement = capabilities[key];
      proposed = constraints[key];
      if (typeof proposed !== 'object') {
        proposed = {exact: proposed};
      }

      if (requirement === void 0) {
        if (this[key] === void 0) {
          settings[key] = proposed.exact || proposed.ideal || proposed.max || proposed.min || 0;
          return true;
        }
        requirement = this[key];
      }

      result = Object.keys(proposed).every(k => {
        var v = proposed[k],
            checkIfWithinRange = (value, range) => {
              if (typeof range !== 'object') {
                return value === range;
              }
              if (range.oneOf) {
                return range.oneOf.indexOf(value) !== -1;
              }
              if (range.min && range.max) {
                return range.min <= value && range.max >= value;
              }
              return false;
            },
            printError = (prop, data) => {
              console.warn(`Specified constraints: \"${prop}\"${data} does not match the capability.`);
            };

        if (k === 'exact') {
          if (checkIfWithinRange(v, requirement)) {
            settings[key] = v;
            return true;
          }
          printError(key, v);
          return false;
        } else if (k === 'min' || k === 'max') {
          return true;
        } else if (k === 'ideal') {
          if (checkIfWithinRange(v, requirement)) {
            if (settings[key] === void 0) {
              settings[key] = v;
            }
            return true;
          }
          printError(key, v);
          return false;
        } else {
          return false;
        }
      });

      if (result && settings[key] === void 0) {
        settings[key] = requirement.defaultValue;
      }

      if (!result) {
        errorReason = key;
      }
      return result;
    });

    if (pass) {
      this.mergeSettings(settings);
    }
    return [pass, errorReason];
  }

  getZeroInformationContent() {
    return this.hal.getZeroInformationContent(this.deviceId);
  }
}

Source.TYPE_CAMERA = 'camera';
Source.TYPE_MICROPHONE = 'microphone';
