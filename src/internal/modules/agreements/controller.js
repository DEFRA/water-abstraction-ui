const { deleteAgreementForm } = require('./forms/delete-agreement');
const water = require('internal/lib/connectors/services').water;
const { logger } = require('internal/logger');

const getDefaultView = request => ({
  ...request.view,
  caption: `Licence ${request.pre.licence.licenceNumber}`
});

const getDeleteAgreement = (request, h) => {
  const { agreement, licence, document } = request.pre;
  return h.view('nunjucks/agreements/delete', {
    ...getDefaultView(request),
    pageTitle: 'You\'re about to delete this agreement',
    back: `/licences/${document.document_id}#charge`,
    agreement,
    licenceId: licence.id,
    form: deleteAgreementForm(request)
  });
};

const postDeleteAgreement = async (request, h) => {
  const { agreementId } = request.params;
  const { document } = request.pre;
  try {
    await water.agreements.deleteAgreement(agreementId);
  } catch (err) {
    logger.info(`Did not successfully delete agreement ${agreementId}`);
  }
  return h.redirect(`/licences/${document.document_id}#charge`);
};

exports.getDeleteAgreement = getDeleteAgreement;
exports.postDeleteAgreement = postDeleteAgreement;
