'use strict';

var _EventTarget2 = require('../../src/EventTarget');

var _EventTarget3 = _interopRequireDefault(_EventTarget2);

var _powerAssert = require('power-assert');

var _powerAssert2 = _interopRequireDefault(_powerAssert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*global describe, it */

describe('EventTarget', function () {
  var SubClass = function (_EventTarget) {
    _inherits(SubClass, _EventTarget);

    function SubClass() {
      _classCallCheck(this, SubClass);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(SubClass).apply(this, arguments));
    }

    return SubClass;
  }(_EventTarget3.default);

  it('allows clients to register event handlers', function (done) {
    var c1 = new SubClass(),
        c2 = new SubClass(),
        v1 = 100,
        v2 = 200,
        h1a = function h1a(e1) {
      _powerAssert2.default.equal(e1, v1);
    },
        h1b = function h1b(e1) {
      _powerAssert2.default.equal(e1, v1);
    },
        h2a = function h2a(e2) {
      _powerAssert2.default.equal(e2, v2);
    },
        h2b = function h2b(e2) {
      _powerAssert2.default.equal(e2, v2);
      done();
    };

    c1.addEventListener('e1', h1a, false);
    c1.addEventListener('e1', h1b, true);
    c2.addEventListener('e2', h2a, false);
    c2.addEventListener('e2', h2b, true);

    c1.emit('e1', v1);
    c2.emit('e2', v2);
  });
});