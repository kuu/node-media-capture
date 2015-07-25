let privateData = new WeakMap();

export default class MediaStreamError {
  constructor(name, message, constraintName) {
    privateData.set(this, {
      name,
      message,
      constraintName
    });
  }

  get name() {
    return privateData.get(this).name;
  }

  get message() {
    return privateData.get(this).message;
  }

  get constraintName() {
    return privateData.get(this).constraintName;
  }
}
