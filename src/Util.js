let seed = 0;

export default {
  copyObject: function copyObject (obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    var copy = new obj.constructor();
    Object.keys(obj).forEach(key => {
      copy[key] = copyObject(obj[key]);
    });
    return copy;
  },
  issueId(prefix='id-') {
    if (seed === 10) {
      seed = 0;
    }
    return prefix + (new Date()).getTime() + seed++;
  },
  throwError(e) {
    throw e;
  },
  promiseAny(promises) {
    // Shamelessly copied from http://jakearchibald.com/2014/offline-cookbook/
    // we implement by inverting Promise.all
    return Promise.all(
      promises.map((promise) => {
        // for each promise, cast it, then swap around rejection & fulfill
        return Promise.resolve(promise).then(
          (val) => {
            this.throwError(val);
          },
          (err) => {
            return err;
          }
        );
      })
    ).then(
      () => { // then swap it back
        this.throwError(Error('Proper any: none fulfilled'));
      },
      (val) => {
        return val;
      }
    );
  }
};
