'use strict';

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _srcEventTarget = require('../../src/EventTarget');

var _srcEventTarget2 = _interopRequireDefault(_srcEventTarget);

var _powerAssert = require('power-assert');

/*global describe, it */

var _powerAssert2 = _interopRequireDefault(_powerAssert);

describe('EventTarget', function () {
  var SubClass = (function (_EventTarget) {
    _inherits(SubClass, _EventTarget);

    function SubClass() {
      _classCallCheck(this, SubClass);

      _get(Object.getPrototypeOf(SubClass.prototype), 'constructor', this).apply(this, arguments);
    }

    return SubClass;
  })(_srcEventTarget2['default']);

  it('allows clients to register event handlers', function (done) {
    var c1 = new SubClass(),
        c2 = new SubClass(),
        v1 = 100,
        v2 = 200,
        h1a = function h1a(e1) {
      _powerAssert2['default'].equal(e1, v1);
    },
        h1b = function h1b(e1) {
      _powerAssert2['default'].equal(e1, v1);
    },
        h2a = function h2a(e2) {
      _powerAssert2['default'].equal(e2, v2);
    },
        h2b = function h2b(e2) {
      _powerAssert2['default'].equal(e2, v2);
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