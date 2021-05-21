'use strict';

const Boom = require('@hapi/boom');
const { identity } = require('lodash');

/**
 * Pre handler to load Return service model
 */
const getReturnById = async request => {
  // Get return ID from either params/query
  const returnId = [
    request.params.returnId,
    request.query.returnId
  ].find(identity);

  const ret = request.services.water.returns.getReturnById(returnId);

  if (!ret) {
    return Boom.notFound(`Return ${returnId} not found`);
  }
  return ret;
};

exports.getReturnById = getReturnById;
