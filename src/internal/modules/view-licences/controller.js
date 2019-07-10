const moment = require('moment');
const services = require('../../lib/connectors/services');
const titleCase = require('title-case');

const pagination = { page: 1, perPage: 10 };

/**
 * View summary information for an expired licence, including returns
 * and communications
 */
const getExpiredLicence = async (request, h) => {
  const { licence, primaryUser, communications } = request.licence;
  const { licence_ref: licenceNumber } = licence;

  const { data: returns } = await services.returns.returns.getLicenceReturns([licenceNumber], pagination);

  const view = {
    ...request.view,
    communications,
    licence: {
      primaryUser,
      licenceNumber,
      expiryDate: moment(licence.earliestEndDate).format('D MMMM YYYY'),
      expiryReason: licence.earliestEndDateReason
    },
    returns,
    pageTitle: `${titleCase(licence.earliestEndDateReason)} licence ${licenceNumber}`
  };

  return h.view('nunjucks/view-licences/expired-licence.njk', view, { layout: false });
};

exports.getExpiredLicence = getExpiredLicence;
