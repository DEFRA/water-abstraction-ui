const { unlinkLicenceForm, unlinkLicenceSchema } = require('./forms/unlink-licence');
const forms = require('shared/lib/forms');
const services = require('../../lib/connectors/services');

const getUnlinkLicence = async (request, h, formFromPost) => {
  const { company: licenceData } = request.licence;

  return h.view('nunjucks/unlink-licence/confirm-unlink-licence', {
    ...request.view,
    pageTitle: `Unlink licence ${licenceData.licenceNumber}`,
    back: `/user/${request.query.userId}/status`,
    licenceData,
    form: formFromPost || unlinkLicenceForm(request, licenceData)
  });
};

const postUnlinkLicence = async (request, h) => {
  const { documentId } = request.params;
  const { company: licenceData } = request.licence;

  const form = forms.handleRequest(
    unlinkLicenceForm(request, licenceData),
    request,
    unlinkLicenceSchema
  );

  if (form.isValid) {
    await services.water.licences.patchUnlinkLicence(documentId, request.defra.userId);
    return h.redirect(
      `/licences/${documentId}/unlink-licence/success` +
      `?userId=${request.query.userId}` +
      `&companyName=${licenceData.companyName}`
    );
  }
  return getUnlinkLicence(request, h, form);
};

const getUnlinkLicenceSuccess = async (request, h) => {
  const { licence_ref: licenceNumber } = request.licence.licence;

  return h.view('nunjucks/unlink-licence/unlink-licence-success', {
    ...request.view,
    pageTitle: `Unlinked licence ${licenceNumber}`,
    licenceNumber,
    companyName: request.query.companyName,
    userPageUrl: `/user/${request.query.userId}/status`
  });
};

exports.getUnlinkLicence = getUnlinkLicence;
exports.postUnlinkLicence = postUnlinkLicence;
exports.getUnlinkLicenceSuccess = getUnlinkLicenceSuccess;
