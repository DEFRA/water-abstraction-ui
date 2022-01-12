'use strict';

const sessionKey = 'notificationsSearch';

const get = request => request.yar.get(sessionKey) || {};

const set = (request, data) => request.yar.set(sessionKey, data);

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
