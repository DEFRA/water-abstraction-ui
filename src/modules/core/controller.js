const { isInternal, isExternal } = require('../../lib/permissions');

const index = async (request, h) => {
  if (isInternal(request)) {
    return h.redirect('/admin/licences');
  } else {
    return h.redirect('/licences');
  }
};

/**
 * 404 page
 */
const getNotFoundError = (request, h) => {
  const view = {
    ...request.view,
    isExternal: isExternal(request),
    pageTitle: 'We cannot find that page'
  };
  return h
    .view('nunjucks/errors/404.njk', view, { layout: false })
    .code(404);
};
module.exports = {
  index,
  getNotFoundError
};
