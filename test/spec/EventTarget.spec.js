import EventTarget from '../../src/EventTarget';
import assert from 'power-assert';

/*global describe, it */

describe('EventTarget', function () {

  class SubClass extends EventTarget {
  }

  it('allows clients to register event handlers', function (done) {
    var c1 = new SubClass(),
        c2 = new SubClass(),
        v1 = 100,
        v2 = 200,
        h1a = (e1) => {
          assert.equal(e1, v1);
        },
        h1b = (e1) => {
          assert.equal(e1, v1);
        },
        h2a = (e2) => {
          assert.equal(e2, v2);
        },
        h2b = (e2) => {
          assert.equal(e2, v2);
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
