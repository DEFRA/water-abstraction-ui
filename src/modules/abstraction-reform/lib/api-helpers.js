const Boom = require('boom');
const { picklists, picklistItems } = require('../../../lib/connectors/water');

/**
 * Gets picklist object from water service
 * @param {String} picklistId - user defined picklist ID
 * @return {Promise} resolves with picklist object
 */
const getPicklist = async (picklistId) => {
  const { data, error } = await picklists.findOne(picklistId);

  if (error) {
    throw Boom.badImplementation(`Error get picklist ${picklistId}`, error);
  }

  return data;
};

/**
 * Gets picklist items from water service
 * @param {String} picklistId - user defined picklist ID
 * @return {Promise} resolves with picklist items array
 */
const getPicklistItems = async (picklistId) => {
  const filter = {
    picklist_id: picklistId
  };
  const sort = {
    value: +1
  };
  return picklistItems.findAll(filter, sort);
};

module.exports = {
  getPicklist,
  getPicklistItems
};
