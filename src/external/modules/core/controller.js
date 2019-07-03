const index = async (request, h) => {
  return h.redirect('/licences');
};

/**
 * Welcome page before routing to signin/register
 */
function getWelcome (request, h) {
  return h.view('nunjucks/core/welcome.njk', request.view, { layout: false });
}

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
exports.getWelcome = getWelcome;
exports.getNotFoundError = getNotFoundError;
