'use-strict';

const { get } = require('lodash');
const forms = require('../forms');
const actions = require('../lib/actions');
const routing = require('../lib/routing');
const { getLicencePageUrl, createPostHandler, getDefaultView } = require('../lib/helpers');

const getNonChargeableReason = async (request, h) => {
  const { licence } = request.pre;
  const backUrl = request.query.start
    ? await getLicencePageUrl(request.pre.licence)
    : routing.getReason(licence.id);

  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, backUrl, forms.nonChargeableReason),
    pageTitle: 'Why is this licence not chargeable?'
  });
};

const postNonChargeableReason = createPostHandler(
  forms.nonChargeableReason,
  actions.setChangeReason,
  request => routing.getEffectiveDate(request.pre.licence.id)
);

const getEffectiveDate = async (request, h) => {
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, routing.getNonChargeableReason, forms.startDate),
    pageTitle: 'Enter effective date'
  });
};

const postEffectiveDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  request => routing.getCheckData(request.pre.licence.id)
);

const getConfirm = async (request, h) => {
  const { licence } = request.pre;

  return h.view('nunjucks/confirm.njk', {
    ...request.view,
    caption: `Licence ${licence.licenceNumber}`,
    licenceUrl: await getLicencePageUrl(licence),
    licence,
    isChargeable: get(request, 'query.chargeable', false),
    pageTitle: 'Charge information complete'
  });
};

exports.getConfirm = getConfirm;
exports.getEffectiveDate = getEffectiveDate;
exports.getNonChargeableReason = getNonChargeableReason;
exports.postEffectiveDate = postEffectiveDate;
exports.postNonChargeableReason = postNonChargeableReason;
