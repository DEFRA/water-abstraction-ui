'use strict';

const { isObject } = require('lodash');
const Boom = require('@hapi/boom');
const { returnStatuses } = require('shared/lib/constants');
const returnPath = require('external/lib/return-path');

const assertReturnStatusIsDue = (request, h) => {
  if (!requestHasReturnModel(request)) {
    return Boom.notFound('Return expected');
  }
  if (!isDueReturn(request.model)) {
    const { path: viewReturnPath } = returnPath.getReturnPath(request.model, request);
    return h
      .redirect(viewReturnPath)
      .takeover();
  }
  return h.continue;
};

const requestHasReturnModel = request => isObject(request.model);

const isDueReturn = ret => ret.status === returnStatuses.due;

exports.assertReturnStatusIsDue = assertReturnStatusIsDue;
