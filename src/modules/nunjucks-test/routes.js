const routes = {};

if (process.env.NODE_ENV === 'local') {
  routes.getNunjucksTest = {
    method: 'GET',
    path: '/nunjucks-test',
    handler: async (request, h) => {
      const { view } = request;
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
