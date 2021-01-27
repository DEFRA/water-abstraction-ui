'use strict';

const { set } = require('lodash');

/**
 * @class allows the management of session data with a key prefix to avoid collision
 */

class SessionSlice {
  constructor (keyPrefix) {
    this._keyPrefix = keyPrefix;
  }

  _getFullKey (key) {
    return `${this._keyPrefix}.${key}`;
  }

  get (request, key) {
    const fullKey = this._getFullKey(key);
    return request.yar.get(fullKey);
  }

  set (request, key, data) {
    const fullKey = this._getFullKey(key);
    return request.yar.set(fullKey, data);
  }

  merge (request, key, data = {}) {
    const existingData = this.get(request, key);
    return this.set(request, key, {
      ...existingData,
      ...data
    });
  }

  setProperty (request, key, propertyPath, value) {
    const fullKey = this._getFullKey(key);
    const data = set(
      request.yar.get(fullKey),
      propertyPath,
      value
    );
    return request.yar.set(fullKey, data);
  }
}

module.exports = SessionSlice;
