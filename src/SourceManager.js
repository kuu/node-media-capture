import EventTarget from './EventTarget';
import Source from './Source';
import Camera from './Camera';
import Microphone from './Microphone';
import MediaStreamError from './MediaStreamError';
import Util from './Util';
import HAL from './HAL';

let privateData = new WeakMap();

// Private function
function prepareSources(manager) {
  let deviceList,
      sources = manager.sources,
      cameras = sources.get(Source.TYPE_CAMERA),
      microphones = sources.get(Source.TYPE_MICROPHONE),
      promises = [];

  deviceList = manager.hal.getAvailableDeviceInfo();
  privateData.get(manager).deviceInfoList = deviceList;

  deviceList.forEach(deviceInfo => {
    let source,
        addSource = (sourceSet, SourceClass) => {
          let alreadyExists = false, s = null;
          for (let entry of sourceSet) {
            if (entry.deviceId === deviceInfo.deviceId) {
              alreadyExists = true;
              break;
            }
          }
          if (!alreadyExists) {
            s = new SourceClass(manager.hal, deviceInfo.deviceId, deviceInfo.groupId, deviceInfo.capabilities);
            sourceSet.add(s);
          }
          return s;
        };

    if (deviceInfo.kind === 'videoinput') {
      source = addSource(cameras, Camera);
    } else if (deviceInfo.kind === 'audioinput') {
      source = addSource(microphones, Microphone);
    }

    if (source) {
     promises.push(source.init());
     source.addEventListener('data', (data) => {
       var iterator = manager.trackEntries.values();
       for (let item of iterator) {
         if (item.source !== source) {
           continue;
         }
         let list = item.sink;
         if (list) {
           for (let sink of list) {
             if (sink.enabled) {
               // actual content
               sink.onData(data);
             } else {
               //  zero-information-content
               sink.onData({data: item.source.getZeroInformationContent()});
             }
           }
         }
       }
     }, false);
    }
  });

  return Promise.all(promises).then(() => {
    console.log('SourceManager: All sources have been initialized.');
    manager.emit('initialized');
    return manager;
  });
}

class Entry {
  constructor (source) {
    this.source = source;
    this.sink = null;
  }
}

export default class SourceManager extends EventTarget {
  static getInstance() {
    return SourceManager.instance;
  }

  constructor () {
    let hal;

    super();

    privateData.set(this, {
      deviceInfoList: null,
      prepareSources,
      error: false
    });

    this.sources = new Map([
      [Source.TYPE_CAMERA, new Set()],
      [Source.TYPE_MICROPHONE, new Set()]
    ]);
    this.trackEntries = new Map();
    hal = this.hal = new HAL();

    // Device discovery
    hal.addEventListener('change', (e) => {
      privateData.get(this).prepareSources(this).then(() => {
        this.emit('devicechange', e);
      });
    }, false);

    privateData.get(this).prepareSources(this).then(
      () => { privateData.get(this).error = false; },
      () => { privateData.get(this).error = true; }
    );
  }

  get deviceInfoList () {
    return privateData.get(this).deviceInfoList;
  }

  get supportedConstraints () {
    return this.hal.supportedConstraints;
  }

  attachSource(trackId, sourceType) {

    if (privateData.get(this).error) {
      return null;
    }

    let trackEntries = this.trackEntries, entry, sources;

    entry = trackEntries.get(trackId);

    if (entry) {
      return entry.source;
    }

    sources = this.sources.get(sourceType);

    if (!sources) {
      Util.throwError(new Error('Unsupported sourceType.'));
    }

    for (let source of sources) {
      source.reference(trackId);
      trackEntries.set(trackId, new Entry(source));
      return source;
    }

    Util.throwError(new Error('Invalid constraints.'));
  }

  detachSource(trackId) {
    let trackEntries = this.trackEntries, entry;

    entry = trackEntries.get(trackId);
    if (entry) {
      entry.source.dereference(trackId);
      trackEntries.delete(trackId);
    }
  }

  applyConstraints(source, constraints) {
    return Promise.resolve().then(() => {
      var basic, advanced, result, reason;

      if (!constraints) {
        return source;
      }

      // Split the constraints object into basic/advanced.
      Object.keys(constraints).forEach(key => {
        var entry = constraints[key];

        if (key === 'advanced') {
          advanced = entry;
        } else {
          if (!basic) {
            basic = {};
          }
          basic[key] = entry;
        }
      });

      if (basic) {
        // Apply basic constraint.
        [result, reason] = source.applyConstraints(basic);
        if (!result) {
          Util.throwError(new MediaStreamError('OverconstrainedError', 'Unable to apply constraints.', reason));
        }
        if (!advanced) {
          source.update();
          return source;
        }
      }

      if (advanced) {
        // Apply advanced constraints.
        if (advanced.some(constraint => {
            [result, reason] = source.applyConstraints(constraint);
            return result;
          })
        ) {
          source.update();
          return source;
        }
      }
      Util.throwError(new MediaStreamError('OverconstrainedError', 'Unable to apply constraints.', reason));
    });
  }

  addSink(trackId, sink) {
    var entry, trackEntries = this.trackEntries;

    entry = trackEntries.get(trackId);

    if (entry) {
      let list = entry.sink;
      if (!list) {
        list = entry.sink = [];
      }
      list.push(sink);
    }
  }

  removeSink(trackId, sink) {
    var entry, trackEntries = this.trackEntries;

    entry = trackEntries.get(trackId);

    if (entry) {
      let list = entry.sink;
      if (list) {
        let index = list.indexOf(sink);
        if (index !== -1) {
          list.splice(index, 1);
          if (list.length === 0) {
            entry.sink = null;
          }
        }
      }
    }
  }

  enableSink(trackId, value) {
    var entry, trackEntries = this.trackEntries;

    entry = trackEntries.get(trackId);

    if (entry) {
      let list = entry.sink;
      if (list) {
        for (let item of list) {
          item.enabled = value;
        }
      }
    }
  }
}

Promise.any = Util.promiseAny;
SourceManager.instance = new SourceManager();
