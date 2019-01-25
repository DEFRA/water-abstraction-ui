const { searchForm, searchFormSchema } = require('./forms/search-form');
const { handleRequest, getValues } = require('../../lib/forms');

const { getInternalSearchResults } = require('../../lib/connectors/water');
const { addFlags } = require('../returns/lib/helpers');

const mapResponseToView = (response, request) => {
  const { documents, returns, users } = response;
  const noResults = !(documents || returns || users);

  return {
    ...response,
    noResults,
    returns: returns ? addFlags(returns, request) : null
  };
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
      console.log('valid!', form);
      const { page } = request.query;
      const { query } = getValues(form);

      const response = await getInternalSearchResults(query, page);

      Object.assign(view, mapResponseToView(response, request), { query });
    }
  }

  view.form = form;

  return h.view('nunjucks/internal-search/index.njk', view, { layout: false });
};

module.exports = {
  getSearchForm
};
