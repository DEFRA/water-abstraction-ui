const moment = require('moment');
const services = require('../../lib/connectors/services');

const pagination = { page: 1, perPage: 10 };

/**
 * View summary information for an expired licence, including returns
 * and communications
 */
const getExpiredLicence = async (request, h) => {
  const { licence_ref: licenceNumber } = request.licence.licence;

  const { data: returns } = await services.returns.returns.getLicenceReturns([licenceNumber], pagination);

  const view = {
    ...request.view,
    licence: {
      primaryUser: request.licence.primaryUser,
      licenceNumber,
      expiryDate: moment(request.licence.licence.earliestEndDate).format('D MMMM YYYY'),
      expiryReason: request.licence.licence.earliestEndDateReason
    },
    returns
  };

  return h.view('nunjucks/view-licences/expired-licence.njk', view, { layout: false });
};

exports.getExpiredLicence = getExpiredLicence;
