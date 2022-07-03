'use strict'

const Hoek = require('@hapi/hoek')

/**
 * Class of general test helper methods
 *
 * The methods here have a more general purpose and can be used across test types, features and domains.
 */
class GeneralHelper {
  /**
   * Deep clone an object
   *
   * In JavaScript assigning an object is by reference. We use 'fixtures' in our tests which are JSON objects read from
   * files. They help us avoid duplication and noise in our tests. Often we need to amend a small part of the object for
   * the purposes of a test. If we didn't clone the fixture before doing this, all subsequent tests would see the
   * altered fixture.
   *
   * There are a number of ways to clone an object. Using the spread operator (`...`) or `Object.assign` however, will
   * only do a shallow clone (copy the top level properties but still reference any sub-properties). Because our
   * fixtures can be multidimensional we need to do a deep clone. Hapi brings in the dependency Hoek which contains a
   * `clone()` method that does deep cloning so we use that.
   *
   * You can read more about cloning objects here https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/
   *
   * @param {Object} thingToBeCloned Object you want to be cloned
   * @returns {Object} a deep clone of the object
   */
  static cloneObject (thingToBeCloned) {
    return Hoek.clone(thingToBeCloned)
  }
}

module.exports = GeneralHelper
