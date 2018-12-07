const routes = {};
const testForm = require('./forms/test.js');
const { handleRequest } = require('../../lib/forms');

const testPayload = {
  text: 'Text here',
  text_hint: 'Some more text here',
  text_error: '',
  'date-day': '1',
  'date-month': '11',
  'date-year': '2018'
};

if (process.env.NODE_ENV === 'local') {
  routes.getNunjucksTest = {
    method: 'GET',
    path: '/nunjucks-test',
    handler: async (request, h) => {
      request.payload = testPayload;

      const form = handleRequest(testForm(request), request);

      console.log(JSON.stringify(form, null, 2));

      const view = {
        ...request.view,
        form
      };
      return h.view('test.njk', view, {
        layout: false
      });
    },
    config: {
      plugins: {
        viewContext: {
          pageTitle: 'A test page',
          activeNavLink: 'view'
        }
      }
    }
  };
}

module.exports = routes;
