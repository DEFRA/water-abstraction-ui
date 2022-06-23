'use-strict'

const forms = require('../forms')
const actions = require('../lib/actions')
const routing = require('../lib/routing')
const { getLicencePageUrl, createPostHandler, getDefaultView } = require('../lib/helpers')

const getNonChargeableReason = async (request, h) => {
  const { licence } = request.pre
  const backUrl = request.query.start === 1
    ? await getLicencePageUrl(request.pre.licence)
    : routing.getReason(licence.id, request.query)

  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, backUrl, forms.reason),
    pageTitle: 'Why is this licence not chargeable?'
  })
}

const postNonChargeableReason = createPostHandler(
  forms.reason,
  actions.setChangeReason,
  request => routing.getEffectiveDate(request.pre.licence.id,
    { chargeVersionWorkflowId: request.query.chargeVersionWorkflowId, returnToCheckData: request.query.returnToCheckData })
)

const getEffectiveDate = async (request, h) => {
  return h.view('nunjucks/form.njk', {
    ...getDefaultView(request, routing.getNonChargeableReason, forms.startDate),
    pageTitle: 'Enter effective date'
  })
}

const postEffectiveDate = createPostHandler(
  forms.startDate,
  actions.setStartDate,
  request => routing.getCheckData(request.pre.licence.id, { chargeVersionWorkflowId: request.query.chargeVersionWorkflowId })
)

exports.getEffectiveDate = getEffectiveDate
exports.getNonChargeableReason = getNonChargeableReason
exports.postEffectiveDate = postEffectiveDate
exports.postNonChargeableReason = postNonChargeableReason
