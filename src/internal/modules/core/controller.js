const index = async (request, h) => h.redirect('/licences');

/**
 * 404 page
 */
const getNotFoundError = (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'We cannot find that page'
  };
  return h
    .view('nunjucks/errors/404.njk', view, { layout: false })
    .code(404);
};

exports.index = index;
exports.getNotFoundError = getNotFoundError;
