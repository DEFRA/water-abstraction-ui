'use strict';

const { returnStatuses } = require('shared/lib/constants');
const returnPath = require('external/lib/return-path');

const assertReturnStatusIsDue = (request, h) => {
  if (!isDueReturn(request.model)) {
    const { path } = returnPath.getReturnPath(request.model, request);
    return h.redirect(path).takeover();
  }
  return h.continue;
};

const isDueReturn = ret => ret.status === returnStatuses.due;

exports.assertReturnStatusIsDue = assertReturnStatusIsDue;
