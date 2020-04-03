'use strict';

const { get } = require('lodash');
const dataService = require('../../../lib/connectors/services');

const getEventForBatch = async batchId => {
  const filter = {
    type: 'billing-batch',
    "metadata->'batch'->>'id'": batchId
  };

  const { data } = await dataService.water.events.findMany(filter);
  return get(data, '[0]', null);
};

exports.getEventForBatch = getEventForBatch;
