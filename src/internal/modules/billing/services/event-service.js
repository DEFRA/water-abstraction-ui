'use strict';

const { get } = require('lodash');
const dataService = require('../../../lib/connectors/services');

const getEventForBatch = async batchId => {
  const filter = {
    type: { $in: ['billing-batch', 'billing-batch:approve-review'] },
    "metadata->'batch'->>'id'": batchId
  };

  const sort = {
    created: -1
  };

  const { data } = await dataService.water.events.findMany(filter, sort);

  return get(data, '[0]', null);
};

exports.getEventForBatch = getEventForBatch;
