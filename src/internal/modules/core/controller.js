const config = require('../../config')

const index = async (request, h) => {
  if (config.featureToggles.useNewSystemSearch) {
    return h.redirect('/system/search')
  }

  return h.redirect('/licences')
}

/**
 * 404 page
 */
const getNotFoundError = (request, h) => {
  const view = {
    ...request.view,
    pageTitle: 'We cannot find that page'
  }
  return h
    .view('nunjucks/errors/404', view)
    .code(404)
}

exports.index = index
exports.getNotFoundError = getNotFoundError
