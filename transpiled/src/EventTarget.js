"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateData = new WeakMap();

var EventTarget = function () {
  function EventTarget() {
    _classCallCheck(this, EventTarget);

    privateData.set(this, {
      capturing: {},
      bubbling: {},
      lastEmittedEvents: {},
      emittingEvents: []
    });
  }

  _createClass(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener(type, listener, useCapture) {
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
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener, useCapture) {
      var dictionary = useCapture ? privateData.get(this).capturing : privateData.get(this).bubbling,
          listeners = dictionary[type],
          index;

      if (listeners) {
        index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }, {
    key: "emit",
    value: function emit(type, event) {
      var sweep = function sweep(listeners) {
        if (listeners) {
          listeners.forEach(function (listener) {
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
  }, {
    key: "reset",
    value: function reset(type) {
      if (type === void 0) {
        privateData.get(this).astEmittedEvents = {};
      } else {
        privateData.get(this).lastEmittedEvents[type] = void 0;
      }
    }
  }]);

  return EventTarget;
}();

exports.default = EventTarget;