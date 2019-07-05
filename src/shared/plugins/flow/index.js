
const { merge } = require('lodash');
const controller = require('./controller');

const getPluginOptions = (flow, state) => {
  return {
    store: flow.store,
    template: state.template || flow.template,
    form: state.form,
    schema: state.schema,
    getNextPath: state.getNextPath,
    getPreviousPath: state.getPreviousPath,
    update: state.update
  };
};

const createGetRoute = (flow, state) => {
  return merge({}, state.route, {
    method: 'GET',
    path: state.path,
    handler: controller.getHandler,
    options: {
      auth: {
        scope: flow.scope
      },
      plugins: {
        flow: getPluginOptions(flow, state)
      }
    }
  });
};

const createPostRoute = (flow, state) => {
  return {
    ...createGetRoute(flow, state),
    handler: controller.postHandler,
    method: 'POST'
  };
};

module.exports = {
  register: (server, options) => {
    const flows = options.flows || [];

    flows.forEach(flow => {
      flow.states.forEach(state => {
        server.route([
          createGetRoute(flow, state),
          createPostRoute(flow, state)
        ]);
      });
    });
  },
  pkg: {
    name: 'flow',
    version: '1.0.0'
  }
};
