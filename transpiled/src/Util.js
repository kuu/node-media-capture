'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var seed = 0;

exports.default = {
  copyObject: function copyObject(obj) {
    if (!obj || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
      return obj;
    }
    var copy = new obj.constructor();
    Object.keys(obj).forEach(function (key) {
      copy[key] = copyObject(obj[key]);
    });
    return copy;
  },
  issueId: function issueId() {
    var prefix = arguments.length <= 0 || arguments[0] === undefined ? 'id-' : arguments[0];

    if (seed === 10) {
      seed = 0;
    }
    return prefix + new Date().getTime() + seed++;
  },
  throwError: function throwError(e) {
    throw e;
  },
  promiseAny: function promiseAny(promises) {
    var _this = this;

    // Shamelessly copied from http://jakearchibald.com/2014/offline-cookbook/
    // we implement by inverting Promise.all
    return Promise.all(promises.map(function (promise) {
      // for each promise, cast it, then swap around rejection & fulfill
      return Promise.resolve(promise).then(function (val) {
        _this.throwError(val);
      }, function (err) {
        return err;
      });
    })).then(function () {
      // then swap it back
      _this.throwError(Error('Proper any: none fulfilled'));
    }, function (val) {
      return val;
    });
  }
};