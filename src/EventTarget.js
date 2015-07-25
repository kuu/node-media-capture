let privateData = new WeakMap();

export default class EventTarget {
  constructor () {
    privateData.set(this, {
      capturing: {},
      bubbling: {},
      lastEmittedEvents: {},
      emittingEvents: []
    });
  }

  addEventListener(type, listener, useCapture) {
    var dictionary = useCapture ? privateData.get(this).capturing : privateData.get(this).bubbling,
        listeners = dictionary[type],
        lastEmittedEvents = privateData.get(this).lastEmittedEvents;

    if (listeners) {
      listeners.push(listener);
    } else {
      dictionary[type] = [listener];
    }

    if (type in lastEmittedEvents && privateData.get(this).emittingEvents.indexOf(type) === -1) {
      this.emit(type, lastEmittedEvents[type]);
    }
  }

  removeEventListener(type, listener, useCapture) {
    var dictionary = useCapture ? privateData.get(this).capturing : privateData.get(this).bubbling,
        listeners = dictionary[type], index;

    if (listeners) {
      index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(type, event) {
    var sweep = listeners => {
      if (listeners) {
        listeners.forEach(listener => {
          listener(event);
        });
      }
    };
    privateData.get(this).lastEmittedEvents[type] = event;
    privateData.get(this).emittingEvents.push(type);
    sweep(privateData.get(this).capturing[type]);
    sweep(privateData.get(this).bubbling[type]);
    privateData.get(this).emittingEvents.pop();
  }

  reset(type) {
    if (type === void 0) {
      privateData.get(this).astEmittedEvents = {};
    } else {
      privateData.get(this).lastEmittedEvents[type] = void 0;
    }
  }
}
