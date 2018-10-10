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
  const { data, error } = await picklistItems.findMany(filter, sort);

  if (error) {
    throw Boom.badImplementation(`Error get picklist items for ${picklistId}`, error);
  }

  return data;
};

module.exports = {
  getPicklist,
  getPicklistItems
};
