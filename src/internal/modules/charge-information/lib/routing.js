'use strict'

const queryString = require('querystring')
const { isEmpty } = require('lodash')
const cleanObject = require('../../../../shared/lib/clean-object')
const { ROUTING_CONFIG: CHARGE_CATEGORY_ROUTING_CONFIG } = require('./charge-categories/constants')

const createUrl = urlTail => (licenceId, queryParams = null) => {
  const qp = cleanObject(queryParams)
  const url = `/licences/${licenceId}/charge-information/${urlTail}`
  return isEmpty(qp) ? url : `${url}?${queryString.stringify(qp)}`
}

exports.getSupportedSourcesRoute = (request, chargeElement, stepKey, checkAnswersRoute) => {
  const { licenceId, elementId } = request.params
  const { chargeVersionWorkflowId, returnToCheckData, additionalChargesAdded } = request.query
  const queryParams = { returnToCheckData, chargeVersionWorkflowId }
  const nextStep = chargeElement.isSupportedSource ? CHARGE_CATEGORY_ROUTING_CONFIG[stepKey].nextStepYes : CHARGE_CATEGORY_ROUTING_CONFIG[stepKey].nextStep
  if (returnToCheckData && !chargeElement.isSupportedSource && !additionalChargesAdded) {
    return checkAnswersRoute
  }
  return this.getChargeCategoryStep(licenceId, elementId, nextStep, { ...queryParams, additionalChargesAdded })
}

exports.getAditionalChargesRoute = (request, chargeElement, stepKey, checkAnswersRoute) => {
  const { licenceId, elementId } = request.params
  const { chargeVersionWorkflowId, returnToCheckData } = request.query
  const queryParams = { returnToCheckData, chargeVersionWorkflowId }
  const nextStep = chargeElement.isAdditionalCharges ? CHARGE_CATEGORY_ROUTING_CONFIG[stepKey].nextStepYes : CHARGE_CATEGORY_ROUTING_CONFIG[stepKey].nextStep
  if (returnToCheckData && !chargeElement.isAdditionalCharges) {
    return checkAnswersRoute
  }
  return returnToCheckData
  // go to the next step but maintain the query param to return
  // to the check your answers page at the end of the additional charges flow
    ? this.getChargeCategoryStep(licenceId, elementId, nextStep, { ...queryParams, additionalChargesAdded: true })
  // go to the next step as normal
    : this.getChargeCategoryStep(licenceId, elementId, nextStep, { chargeVersionWorkflowId })
}

exports.getChargeElementStep = (licenceId, elementId, step, queryParams) => createUrl(`charge-element/${elementId}/${step}`)(licenceId, queryParams)
exports.getChargeCategoryStep = (licenceId, elementId, step, queryParams) => createUrl(`charge-category/${elementId}/${step}`)(licenceId, queryParams)

exports.postReview = (chargeVersionWorkflowId, licenceId) => createUrl(`${chargeVersionWorkflowId}/review`)(licenceId)
exports.getReview = (chargeVersionWorkflowId, licenceId) => createUrl(`${chargeVersionWorkflowId}/review`)(licenceId)

exports.getHandleBillingAccount = createUrl('set-billing-account')
exports.getSubmitted = createUrl('submitted')
exports.getCheckData = createUrl('check')
exports.getReason = createUrl('create')
exports.getStartDate = createUrl('start-date')
exports.getSelectBillingAccount = createUrl('billing-account')
exports.getUseAbstractionData = createUrl('use-abstraction-data')
exports.getEffectiveDate = createUrl('effective-date')
exports.getNonChargeableReason = createUrl('non-chargeable-reason')
exports.getCancelData = createUrl('cancel')
exports.getNote = createUrl('note')
