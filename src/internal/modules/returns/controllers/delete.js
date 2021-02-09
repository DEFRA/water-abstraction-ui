const services = require('internal/lib/connectors/services');
const { form: deleteReturnForm } = require('../forms/delete-return');

const getDeleteReturn = (request, h) => {
  const { id } = request.query;

  return h.view('nunjucks/returns/delete', {
    ...request.view,
    id,
    back: `/returns/return?id=${id}`,
    backText: 'Cancel and go back',
    form: deleteReturnForm(request, { id }),
    pageTitle: 'Deleting a return'
  });
};

const postDeleteReturn = (request, h) => {
  const { returnId } = request.payload;

  // do stuff
  services.water.returns.deleteReturn(encodeURIComponent(returnId));

  return h.redirect('/');
};

exports.getDeleteReturn = getDeleteReturn;
exports.postDeleteReturn = postDeleteReturn;
