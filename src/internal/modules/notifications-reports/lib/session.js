'use strict';

const SESSION_KEY_FILTER = 'notificationFilterPlugin';

const getUserSessionKey = userKey => `${SESSION_KEY_FILTER}.${userKey}`;

const getSelectedFilter = (request, key) => request.yar.get(getUserSessionKey(key));

const setSelectedFilter = (request, key, data) => request.yar.set(getUserSessionKey(key), data);

const mergeRequest = (request, key, data) => {
  const existingData = getSelectedFilter(request, key);
  return setSelectedFilter(request, key, {
    ...existingData,
    ...data
  });
};

exports.get = getSelectedFilter;
exports.set = setSelectedFilter;
exports.merge = mergeRequest;
