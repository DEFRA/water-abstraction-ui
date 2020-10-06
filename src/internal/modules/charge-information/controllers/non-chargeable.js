'use-strict';

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

exports.getEffectiveDate = getEffectiveDate;
exports.getNonChargeableReason = getNonChargeableReason;
exports.postEffectiveDate = postEffectiveDate;
exports.postNonChargeableReason = postNonChargeableReason;
