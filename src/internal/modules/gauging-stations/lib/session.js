'use strict';

const getSessionKey = request => `licenceTaggingProcess.${request.defra.entityId}`;

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

const clear = request => {
  set(request, {});
};

exports.get = get;
exports.set = set;
exports.merge = merge;
exports.clear = clear;
