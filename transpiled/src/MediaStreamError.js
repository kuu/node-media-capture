"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateData = new WeakMap();

var MediaStreamError = function () {
  function MediaStreamError(name, message, constraintName) {
    _classCallCheck(this, MediaStreamError);

    privateData.set(this, {
      name: name,
      message: message,
      constraintName: constraintName
    });
  }

  _createClass(MediaStreamError, [{
    key: "name",
    get: function get() {
      return privateData.get(this).name;
    }
  }, {
    key: "message",
    get: function get() {
      return privateData.get(this).message;
    }
  }, {
    key: "constraintName",
    get: function get() {
      return privateData.get(this).constraintName;
    }
  }]);

  return MediaStreamError;
}();

exports.default = MediaStreamError;