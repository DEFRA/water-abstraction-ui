const moment = require('moment');
const services = require('../../lib/connectors/services');
const titleCase = require('title-case');
const { sortBy } = require('lodash');
const permissions = require('../../lib/permissions');
const { getReturnPath } = require('../../lib/return-path');

const pagination = { page: 1, perPage: 10 };

/**
 * View summary information for an expired licence, including returns
 * and communications
 */
const getExpiredLicence = async (request, h) => {
  const { licence, primaryUser, communications, chargeVersions } = request.licence;
  const { licence_ref: licenceNumber } = licence;

  const { data: returns } = await services.returns.returns.getLicenceReturns([licenceNumber], pagination);

  const view = {
    documentId: request.params.documentId,
    ...request.view,
    communications,
    licence: {
      primaryUser,
      licenceNumber,
      expiryDate: moment(licence.earliestEndDate).format('D MMMM YYYY'),
      expiryReason: licence.earliestEndDateReason
    },
    showChargeVersions: permissions.isCharging(request),
    chargeVersions: sortBy(chargeVersions, 'versionNumber').reverse(),
    returns: returns.map(ret => ({ ...ret, ...getReturnPath(ret, request) })),
    pageTitle: `${titleCase(licence.earliestEndDateReason)} licence ${licenceNumber}`
  };

  return h.view('nunjucks/view-licences/expired-licence', view);
};

exports.getExpiredLicence = getExpiredLicence;
