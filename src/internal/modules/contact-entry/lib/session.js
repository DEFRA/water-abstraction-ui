'use strict';

const SESSION_KEY = 'contactEntryPlugin';

const getSessionKey = userKey => `${SESSION_KEY}.${userKey}`;

const get = (request, key) => request.yar.get(getSessionKey(key));

const set = (request, key, data) => request.yar.set(getSessionKey(key), data);

const merge = (request, key, data) => {
  const existingData = get(request, key);
  return set(request, key, {
    ...existingData,
    ...data
  });
};

exports.get = get;
exports.set = set;
exports.merge = merge;
