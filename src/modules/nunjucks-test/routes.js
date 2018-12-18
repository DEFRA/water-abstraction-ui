const routes = {};
const testForm = require('./forms/test.js');
const { handleRequest } = require('../../lib/forms');

const config = {
  plugins: {
    viewContext: {
      pageTitle: 'A test page',
      activeNavLink: 'view'
    }
  }
};

if (process.env.NODE_ENV === 'local') {
  routes.getNunjucksTest = {
    method: 'GET',
    path: '/nunjucks-test',
    handler: async (request, h) => {
      const form = testForm(request);

      const view = {
        ...request.view,
        form
      };
      return h.view('nunjucks/test.njk', view, {
        layout: false
      });
    },
    config
  };

  routes.postNunjucksTest = {
    method: 'POST',
    path: '/nunjucks-test',
    handler: async (request, h) => {
      const form = handleRequest(testForm(request), request);

      const view = {
        ...request.view,
        form
      };
      return h.view('nunjucks/test.njk', view, {
        layout: false
      });
    },
    config
  };
}

module.exports = routes;
