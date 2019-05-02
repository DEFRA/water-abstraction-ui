const { last } = require('lodash');
const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers');

const config = require('../../../../config');
const serviceRequest = require('../service-request');

/**
 * Gets due returns in the current returns cycle for the specified company
 * @param  {String} entityId - company entity ID GUID
 * @return {Promise<Array>} resolves with an array of returns
 */
const getCurrentDueReturns = entityId => {
  const currentCycle = last(createReturnCycles());
  const url = `${config.services.water}/company/${entityId}/returns`;
  const options = {
    qs: {
      ...currentCycle,
      status: 'due'
    }
  };
  console.log(url, options);
  return serviceRequest.get(url, options);
};

exports.getCurrentDueReturns = getCurrentDueReturns;
