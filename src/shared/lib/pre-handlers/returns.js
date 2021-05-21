'use strict';

const { identity } = require('lodash');
const { errorHandler } = require('./lib/error-handler');

/**
 * Pre handler to load Return service model
 */
const getReturnById = async request => {
  // Get return ID from either params/query
  const returnId = [
    request.params.returnId,
    request.query.returnId
  ].find(identity);

  try {
    return await request.services.water.returns.getReturnById(returnId);
  } catch (err) {
    return errorHandler(err, `Return ${returnId} not found`);
  }
};

exports.getReturnById = getReturnById;
