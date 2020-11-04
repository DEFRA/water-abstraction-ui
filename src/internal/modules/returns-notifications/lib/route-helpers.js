'use strict';

const createHandlerPair = (controller, getMethodName, config) => {
  const postMethodName = getMethodName.replace('get', 'post');
  return {
    [getMethodName]: {
      method: 'GET',
      handler: controller[getMethodName],
      ...config
    },
    [postMethodName]: {
      method: 'POST',
      handler: controller[postMethodName],
      ...config
    }
  };
};

const createFormRoutes = (controller, config) =>
  Object.keys(config).reduce((acc, getMethodName) => ({
    ...acc,
    ...createHandlerPair(controller, getMethodName, config[getMethodName])
  }), {});

exports.createHandlerPair = createHandlerPair;
exports.createFormRoutes = createFormRoutes;
