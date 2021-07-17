'use strict';

const identifyWhichFlowThisIs = path => {
  const regex = /((www\.)?([^/\n\r]+))\/?([^?\n\r]+)?\??([^#\n\r]*)?#?([^\n\r]*)/g;
  return path.match(regex)[0].split('/')[2];
};

const getSessionKey = request => {
  const flowIdentifier = identifyWhichFlowThisIs(request.view.path);
  return `waa.${request.params.gaugingStationId}.${flowIdentifier}`;
};

const get = request => {
  const key = getSessionKey(request);
  return request.yar.get(key) || {};
};

const set = (request, data) => {
  const key = getSessionKey(request);
  return request.yar.set(key, data);
};

const merge = (request, data) => {
  const existingData = get(request);
  return set(request, {
    ...existingData,
    ...data
  });
};

const clear = request => set(request, {});

exports.get = get;
exports.set = set;
exports.merge = merge;
exports.clear = clear;
