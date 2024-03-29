'use-strict'
const cleanObject = require('../../../../shared/lib/clean-object')
const forms = require('../forms/charge-category/index')
const routing = require('../lib/routing')
const { getDefaultView, getPostedForm, getChargeCategoryFirstStep, applyFormResponse } = require('../lib/helpers')
const {
  ROUTING_CONFIG,
  getStepKeyByValue
} = require('../lib/charge-categories/constants')
const actions = require('../lib/actions')
const { processElements } = require('internal/modules/charge-information/lib/helpers')
const getChargeElement = request => {
  const { elementId } = request.params
  const { draftChargeInformation } = request.pre
  return draftChargeInformation.chargeElements.find(element => element.id === elementId)
}

const getBackLink = (request, stepKey) => {
  const { licenceId, elementId } = request.params
  const { chargeVersionWorkflowId } = request.query
  const routeConfig = ROUTING_CONFIG[stepKey]
  let { back } = routeConfig
  const chargeElement = getChargeElement(request)

  if (routeConfig === ROUTING_CONFIG.isSupplyPublicWater && chargeElement.supportedSourceName) {
    back = ROUTING_CONFIG.supportedSourceName.step
  }

  if (request.query.returnToCheckData === true) {
    return routing.getCheckData(licenceId)
  }
  return routeConfig.step === getChargeCategoryFirstStep(request)
    ? routing.getCheckData(licenceId, { chargeVersionWorkflowId })
    : routing.getChargeCategoryStep(licenceId, elementId, back, { chargeVersionWorkflowId })
}

const getRedirectPath = (request, stepKey) => {
  const { licenceId, elementId } = request.params
  const chargeElement = getChargeElement(request)
  const { chargeVersionWorkflowId, returnToCheckData, additionalChargesAdded } = request.query
  const queryParams = { returnToCheckData, chargeVersionWorkflowId }
  const routeConfig = ROUTING_CONFIG[stepKey]

  const checkAnswersRoute = request.pre.draftChargeInformation.status === 'review'
    ? routing.postReview(chargeVersionWorkflowId, licenceId)
    : routing.getCheckData(licenceId, { chargeVersionWorkflowId })

  // Adjustments Page or Is the water supply -- these two steps are both at the end of the flow or subflow
  if ((routeConfig === ROUTING_CONFIG.adjustments) || (routeConfig === ROUTING_CONFIG.isSupplyPublicWater && returnToCheckData)) {
    return checkAnswersRoute
  }

  // Additional charges flow start
  if ((routeConfig === ROUTING_CONFIG.isAdditionalCharges)) {
    return routing.getAditionalChargesRoute(request, chargeElement, stepKey, checkAnswersRoute)
  }

  // Is a supported source name required
  if (routeConfig === ROUTING_CONFIG.isSupportedSource) {
    return routing.getSupportedSourcesRoute(request, chargeElement, stepKey, checkAnswersRoute)
  }

  // supportedSourceName
  if (routeConfig === ROUTING_CONFIG.supportedSourceName && returnToCheckData) {
    return additionalChargesAdded
      ? routing.getChargeCategoryStep(licenceId, elementId, routeConfig.nextStep, queryParams)
      : checkAnswersRoute
  }

  if (returnToCheckData) {
    return checkAnswersRoute
  }

  return routing.getChargeCategoryStep(licenceId, elementId, routeConfig.nextStep, queryParams)
}

const getChargeCategoryStep = async (request, h) => {
  const { step } = request.params
  const stepKey = getStepKeyByValue(step)

  // If the page we're trying to get is the public water page, and this isn't a water undertaker, skip the page
  if (stepKey === 'isSupplyPublicWater' && !request.pre.licence.isWaterUndertaker) {
    const redirectPath = getRedirectPath(request, stepKey)
    return h.redirect(redirectPath)
  }

  return h.view('nunjucks/form', {
    ...getDefaultView(request, getBackLink(request, stepKey), forms[step]),
    pageTitle: ROUTING_CONFIG[stepKey].pageTitle
  })
}

const adjustementsHandler = async (request, draftChargeInformation) => {
  const { licenceId, elementId } = request.params
  const { chargeVersionWorkflowId } = request.query
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId)
  if (request.payload.isAdjustments === 'true') {
    return routing.getChargeCategoryStep(licenceId, elementId, ROUTING_CONFIG.isAdjustments.nextStep, { chargeVersionWorkflowId })
  }

  chargeElement.isAdjustments = false
  chargeElement.adjustments = {}
  request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation)
  return getRedirectPath(request, 'adjustments')
}

const postChargeCategoryStep = async (request, h) => {
  const { step, licenceId, elementId } = request.params
  const { chargeVersionWorkflowId } = request.query
  const form = getPostedForm(request, forms[step])

  if (!form.isValid) {
    const queryParams = cleanObject(request.query)
    return h.postRedirectGet(form, routing.getChargeCategoryStep(licenceId, elementId, step), queryParams)
  }

  const stepKey = getStepKeyByValue(step)
  const routeConfig = ROUTING_CONFIG[stepKey]
  const { draftChargeInformation, supportedSources } = request.pre
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId)

  if (routeConfig === ROUTING_CONFIG.isAdjustments) {
    // If isSupplyPublicWater hasn't been set at this point we need to set it to false
    if (chargeElement.isSupplyPublicWater === undefined) {
      chargeElement.isSupplyPublicWater = false
      request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation)
    }
    const route = await adjustementsHandler(request, draftChargeInformation)
    return h.redirect(route)
  }

  if (routeConfig === ROUTING_CONFIG.whichElement) {
    const selectedElementIds = form.fields.find(field => field.name === 'selectedElementIds').value
    processElements(request, elementId, selectedElementIds)
    return h.redirect(getRedirectPath(request, stepKey))
  }

  if (routeConfig === ROUTING_CONFIG.isSupportedSource && request.payload.isSupportedSource === 'false') {
    delete chargeElement.supportedSourceName
    request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation)
  }

  if (routeConfig === ROUTING_CONFIG.supportedSourceName) {
    const { supportedSourceId } = request.payload
    const supportedSource = supportedSources.find(({ id }) => id === supportedSourceId)
    chargeElement.supportedSourceName = supportedSource.name
    request.setDraftChargeInformation(licenceId, chargeVersionWorkflowId, draftChargeInformation)
  }

  await applyFormResponse(request, form, actions.setChargeElementData)

  const redirectPath = getRedirectPath(request, stepKey)
  return h.redirect(redirectPath)
}

module.exports = {
  getRedirectPath,
  getChargeCategoryStep,
  postChargeCategoryStep
}
