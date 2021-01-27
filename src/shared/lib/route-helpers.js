'use strict';

const { camelCase } = require('lodash');

/**
 * Creates a pair of routes, one for the GET and one for the POST,
 * to reduce boilerplate code in route definitions
 * @param {Object} controller
 * @param {String} methodNameSuffix
 * @param {Object} config - hapi route config options for GET and POST
 * @return {Object}
 */
const createRoutePair = (controller, methodNameSuffix, config) => {
  const getMethodName = camelCase(`get_${methodNameSuffix}`);
  const postMethodName = camelCase(`post_${methodNameSuffix}`);
  return {
    [getMethodName]: {
      method: 'get',
      handler: controller[getMethodName],
      ...config
    },
    [postMethodName]: {
      method: 'post',
      handler: controller[postMethodName],
      ...config
    }
  };
};

const createFormRoutes = (controller, config) =>
  Object.keys(config).reduce((acc, methodNameSuffix) => ({
    ...acc,
    ...createRoutePair(controller, methodNameSuffix, config[methodNameSuffix])
  }), {});

exports.createRoutePair = createRoutePair;
exports.createFormRoutes = createFormRoutes;
