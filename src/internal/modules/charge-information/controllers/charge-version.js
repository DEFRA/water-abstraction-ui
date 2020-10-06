'use-strict';

const { getDefaultView, getLicencePageUrl } = require('../lib/helpers');

const getViewChargeVersion = async (request, h) => {
  const { chargeVersion } = request.pre;
  const backLink = await getLicencePageUrl(chargeVersion.licence);

  return h.view('nunjucks/charge-information/check', {
    ...getDefaultView(request, backLink),
    pageTitle: `Charge information valid from ${chargeVersion.dateRange.startDate}`,
    chargeVersion
  });
};

exports.getViewChargeVersion = getViewChargeVersion;
