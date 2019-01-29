const { get } = require('lodash');
const { searchForm, searchFormSchema } = require('./forms/search-form');
const { handleRequest, getValues } = require('../../lib/forms');
const water = require('../../lib/connectors/water');
const { mapResponseToView } = require('./lib/api-response-mapper');
const { isReturnId } = require('../returns/lib/helpers');

const isReturnRedirect = (query, view) => {
  return isReturnId(query) && get(view, 'returns.length') === 1;
};

/**
 * Renders a search form and results pages for internal users to search
 * for licences, licence holders, users, and returns
 * @param  {Object} request - HAPI request
 * @param {String} request.query.query - the search term
 * @param  {Object} h       - HAPI response toolkit
 * @return {Promise}        - resolves with response
 */
const getSearchForm = async (request, h) => {
  let form = searchForm();

  const { view } = request;

  if ('query' in request.query) {
    form = handleRequest(form, request, searchFormSchema);

    if (form.isValid) {
      const { page } = request.query;
      const { query } = getValues(form);

      const response = await water.getInternalSearchResults(query, page);

      Object.assign(view, mapResponseToView(response, request), { query });

      // Redirect to return
      if (isReturnRedirect(query, view)) {
        return h.redirect(view.returns[0].path);
      }
    }
  }

  view.form = form;

  return h.view('nunjucks/internal-search/index.njk', view, { layout: false });
};

module.exports = {
  getSearchForm
};
