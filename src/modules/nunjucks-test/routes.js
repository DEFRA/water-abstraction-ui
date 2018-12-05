
module.exports = {
  getNunjucksTest: {
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
  }
};
