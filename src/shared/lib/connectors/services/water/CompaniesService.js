const ServiceClient = require('../ServiceClient');
const { last } = require('lodash');
const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers');

class CompaniesService extends ServiceClient {
  /**
   * Gets due returns in the current returns cycle for the specified company
   * @param  {String} entityId - company entity ID GUID
   * @return {Promise<Array>} resolves with an array of returns
   */
  getCurrentDueReturns (entityId) {
    const currentCycle = last(createReturnCycles());
    const url = this.joinUrl('company', entityId, 'returns');
    const options = {
      qs: {
        ...currentCycle,
        status: 'due'
      }
    };
    return this.serviceRequest.get(url, options);
  }
}

module.exports = CompaniesService;
