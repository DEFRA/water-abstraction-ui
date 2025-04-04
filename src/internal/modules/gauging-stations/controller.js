'use strict'

const { logger } = require('../../logger')
const linkageForms = require('./forms')
const formHandler = require('shared/lib/form-handler')
const formHelpers = require('shared/lib/forms')
const session = require('./lib/session')
const helpers = require('./lib/helpers')
const { groupBy, endsWith } = require('lodash')
const services = require('../../lib/connectors/services')
const { waterAbstractionAlerts: isWaterAbstractionAlertsEnabled } = require('../../config').featureToggles
const { hasScope } = require('../../lib/permissions')
const { manageGaugingStationLicenceLinks, hofNotifications } = require('../../lib/constants').scope

const { featureToggles: featureFlags } = require('../../config.js')

/**
 * Main Gauging station page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.gaugingStationId - gaugingStation guid
 */

const getMonitoringStation = async (request, h) => {
  const { licenceGaugingStations, station } = request.pre
  const { data } = licenceGaugingStations

  const hasPermissionToManageLinks = hasScope(request, [manageGaugingStationLicenceLinks])
  const hasPermissionToSendAlert = hasScope(request, [hofNotifications])

  return h.view('nunjucks/gauging-stations/gauging-station', {
    ...request.view,
    pageTitle: helpers.createTitle(station),
    station,
    sendUrl: `/monitoring-stations/${station.gaugingStationId}/send-alert`,
    hasPermissionToManageLinks,
    hasPermissionToSendAlert,
    isWaterAbstractionAlertsEnabled,
    licenceGaugingStations: helpers.groupByLicence(data),
    back: '/licences'
  })
}

const getNewTaggingFlow = (request, h) => h.redirect(`${request.path}/threshold-and-unit`)

const getNewTaggingThresholdAndUnit = async (request, h) => {
  const caption = await helpers.getCaption(request)
  const pageTitle = 'What is the licence hands-off flow or level threshold?'
  const { path } = request

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, ''),
    form: formHandler.handleFormRequest(request, linkageForms.newTagThresholdAndUnitForm)
  })
}

const postNewTaggingThresholdAndUnit = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagThresholdAndUnitForm)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  session.merge(request, {
    threshold: form.fields.find(field => field.name === 'threshold'),
    unit: form.fields.find(field => field.name === 'unit')
  })

  return helpers.redirectTo(request, h, '/alert-type')
}

const getNewTaggingAlertType = async (request, h) => {
  const pageTitle = 'Does the licence holder need to stop or reduce at this threshold?'
  const caption = await helpers.getCaption(request)
  const { path } = request

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/threshold-and-unit'),
    form: formHandler.handleFormRequest(request, linkageForms.newTagAlertType)
  })
}

const postNewTaggingAlertType = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagAlertType)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  session.merge(request, {
    alertType: form.fields.find(field => field.name === 'alertType'),
    volumeLimited: form.fields
      .find(field => field.name === 'alertType').options.choices
      .find(field => field.value === 'reduce').fields
      .find(field => field.name === 'volumeLimited')
  })

  return helpers.redirectTo(request, h, '/licence-number')
}

const getNewTaggingLicenceNumber = async (request, h) => {
  const pageTitle = 'Enter the licence number this threshold applies to'
  const caption = await helpers.getCaption(request)
  const { path } = request

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/alert-type'),
    form: formHandler.handleFormRequest(request, linkageForms.newTagWhichLicence)
  })
}

const postNewTaggingLicenceNumber = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagWhichLicence)
  const enteredLicenceNumber = form.fields.find(field => field.name === 'licenceNumber')

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }
  if (!request.pre.isLicenceNumberValid) {
    const formWithErrors = formHelpers.applyErrors(form, [{
      name: 'licenceNumber',
      message: 'No licences in the service match the number you entered. Check the licence number and enter again.',
      summary: 'Licence could not be found'
    }])
    return h.postRedirectGet(formWithErrors)
  }

  session.merge(request, {
    licenceNumber: enteredLicenceNumber
  })

  return helpers.redirectTo(request, h, '/condition')
}

const getNewTaggingCondition = async (request, h) => {
  const sessionData = session.get(request)
  const pageTitle = `Select the full condition for licence ${sessionData.licenceNumber.value}`
  const caption = await helpers.getCaption(request)
  const { path } = request

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/licence-number'),
    form: formHandler.handleFormRequest(request, linkageForms.newTagWhichCondition)
  })
}

const postNewTaggingCondition = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagWhichCondition)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const condition = form.fields.find(field => field.name === 'condition')

  session.merge(request, {
    condition
  })

  const conditionIsValid = condition.value !== helpers.blankGuid

  return helpers.redirectTo(request, h, conditionIsValid ? '/check' : '/abstraction-period')
}

const getNewTaggingManuallyDefinedAbstractionPeriod = async (request, h) => {
  const pageTitle = 'Enter an abstraction period for licence'
  const caption = await helpers.getCaption(request)
  const { path } = request

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/condition'),
    form: formHandler.handleFormRequest(request, linkageForms.newTagManuallyDefinedAbstractionPeriod)
  })
}

const postNewTaggingManuallyDefinedAbstractionPeriod = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagManuallyDefinedAbstractionPeriod)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  session.merge(request, {
    startDate: form.fields.find(field => field.name === 'startDate'),
    endDate: form.fields.find(field => field.name === 'endDate')
  })

  return helpers.redirectTo(request, h, '/check')
}

const getNewTaggingCheckYourAnswers = async (request, h) => {
  const pageTitle = 'Check the restriction details'
  const caption = await helpers.getCaption(request)
  const { path } = request

  const sessionData = session.merge(request, {
    checkStageReached: true
  })

  const selectedConditionText = helpers.getSelectedConditionText(request)

  const abstractionPeriodData = selectedConditionText && sessionData.startDate
    ? {
        startDay: sessionData.startDate.value.split('-').reverse()[0],
        startMonth: sessionData.startDate.value.split('-').reverse()[1],
        endDay: sessionData.endDate.value.split('-').reverse()[0],
        endMonth: sessionData.endDate.value.split('-').reverse()[1]
      }
    : {}

  return h.view('nunjucks/gauging-stations/new-tag-check', {
    ...request.view,
    caption,
    pageTitle,
    back: path.replace(/\/[^/]*$/, '/condition'),
    form: formHandler.handleFormRequest(request, linkageForms.newTagCheckYourAnswers),
    sessionData,
    selectedConditionText,
    abstractionPeriodData
  })
}

const postNewTaggingCheckYourAnswers = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.newTagCheckYourAnswers)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  await helpers.handlePost(request)

  return h.redirect(request.path.replace(/\/[^/]*$/, '/complete'))
}

const getNewTaggingFlowComplete = (request, h) => {
  const { licenceNumber } = session.get(request)
  session.clear(request)

  let monitoringStationUrl = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    monitoringStationUrl = `/system${monitoringStationUrl}`
  }

  return h.view('nunjucks/gauging-stations/new-tag-complete', {
    pageTitle: 'Licence added to monitoring station',
    back: null,
    licenceRef: licenceNumber.value,
    gaugingStationId: request.params.gaugingStationId,
    monitoringStationUrl
  })
}

const removeTagURL = {
  selectCondition: '/remove-tag-multiple',
  selectCompleted: '/remove-tag-complete',
  monitoringStation: '/../'
}

const getRemoveTags = async (request, h) => {
  const pageTitle = 'Which licence do you want to remove a tag from?'
  const caption = await helpers.getCaption(request)
  const { licenceGaugingStations } = request.pre
  const { data } = licenceGaugingStations

  // NOTE: We have updated this just for correctness! Back links are ignored in the legacy UI because of the back link
  // high-jacking implemented in client-side JavaScript we send to the browser.
  let back = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    back = `/system${back}`
  }

  /* Used in second step for Multiple tags */
  session.merge(request, {
    selectedLicence: [],
    selectedCondition: [], /* clear selection */
    licenceGaugingStations: data
  })

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView), /* Generates deduplicated list */
    sessionData: session.get(request),
    back
  })
}

const postRemoveTagOrMultiple = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView) // Back to view
  // Must select one radio
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  let tagsForLicence = []
  const selectedLicenceRadio = form.fields.find(field => field.name === 'selectedLicence')
  const sessionData = session.merge(request, {
    selectedLicence: selectedLicenceRadio,
    selectedCondition: [] /* clear selection */
  })

  if (!sessionData.licenceGaugingStations) {
    return helpers.redirectTo(request, h, removeTagURL.monitoringStation)
  }

  if (selectedLicenceRadio) {
    tagsForLicence = sessionData.licenceGaugingStations.filter(item => item.licenceId === selectedLicenceRadio.value)
  }

  const redirectPath = tagsForLicence.length > 1 ? removeTagURL.selectCondition : removeTagURL.selectCompleted
  return helpers.redirectTo(request, h, redirectPath)
}

const getRemoveTagsConditions = async (request, h) => {
  const pageTitle = 'This licence has more than one tag, select the ones you need to remove'
  const caption = await helpers.getCaption(request)

  const sessionData = session.merge(request, {
    selectedCondition: [] /* clear selection */
  })

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceConditions),
    sessionData,
    back: `/monitoring-stations/${request.params.gaugingStationId}/untagging-licence/remove-tag`
  })
}

const postRemoveTagsLicenceSelected = async (request, h) => {
  const formCheckBox = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceConditions)
  if (!formCheckBox.isValid) {
    return h.postRedirectGet(formCheckBox)
  }

  const selectedCondition = formCheckBox.fields.find(field => field.name === 'selectedCondition')
  session.merge(request, {
    selectedCondition
  })

  return helpers.redirectTo(request, h, removeTagURL.selectCompleted)
}

const getRemoveTagComplete = async (request, h) => {
  const pageTitle = 'You are about to remove tags from this licence'
  const caption = await helpers.getCaption(request)
  const sessionData = session.get(request)

  const form = await formHandler.handleFormRequest(request, linkageForms.removeTagsLicenceView)
  const selectedLicenceRadio = form.fields.find(field => field.name === 'selectedLicence')
  const dataRadioChoices = selectedLicenceRadio ? selectedLicenceRadio.options.choices : []
  let selectedMultiple = false
  let selectedSingle = false
  let radioChoicesSelected = []

  if (dataRadioChoices) {
    radioChoicesSelected = sessionData.selectedLicence ? dataRadioChoices.filter(item => item.value === sessionData.selectedLicence.value) : []
    selectedMultiple = radioChoicesSelected.find(field => field.hint === ' Multiple tags')
    selectedSingle = radioChoicesSelected.find(field => field.hint !== ' Multiple tags')
  }
  if (selectedMultiple) {
    session.merge(request, {
      selected: helpers.selectedConditionWithLinkages(request) ? helpers.selectedConditionWithLinkages(request) : []
    })
  } else {
    /* Handle case when selected item already deleted */
    if (!selectedSingle) {
      return helpers.redirectTo(request, h, removeTagURL.monitoringStation)
    }
    selectedSingle.linkages = []
    session.merge(request, {
      selected: [selectedSingle]
    })
  }
  return h.view('nunjucks/gauging-stations/remove-tag-complete', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.removeTagConfirm),
    sessionData: session.get(request),
    back: `/monitoring-stations/${request.params.gaugingStationId}/untagging-licence/remove-tag`
  })
}

const postRemoveTagComplete = async (request, h) => {
  await helpers.handleRemovePost(request)

  let monitoringStationUrl = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    monitoringStationUrl = `/system${monitoringStationUrl}`
  }

  return h.redirect(monitoringStationUrl)
}

const getSendAlertSelectAlertType = async (request, h) => {
  const pageTitle = 'Select the type of alert you need to send'
  const caption = await helpers.getCaption(request)

  // NOTE: We have updated this just for correctness! Back links are ignored in the legacy UI because of the back link
  // high-jacking implemented in client-side JavaScript we send to the browser.
  let back = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    back = `/system${back}`
  }

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    sessionData: session.get(request),
    form: formHandler.handleFormRequest(request, linkageForms.sendingAlertType),
    back
  })
}

const postSendAlertSelectAlertType = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.sendingAlertType)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const selectedAlertType = form.fields.find(field => field.name === 'alertType')
  session.merge(request, {
    sendingAlertType: selectedAlertType
  })

  return h.redirect(request.path.replace(/\/[^/]*$/, '/alert-thresholds'))
}

const getSendAlertSelectAlertThresholds = async (request, h) => {
  const pageTitle = 'Which thresholds do you need to send an alert for?'
  const caption = await helpers.getCaption(request)

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    sessionData: session.get(request),
    form: formHandler.handleFormRequest(request, linkageForms.sendingAlertThresholds),
    back: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/alert-type`
  })
}

const postSendAlertSelectAlertThresholds = async (request, h) => {
  const { licenceGaugingStations } = request.pre
  const form = await formHandler.handleFormRequest(request, linkageForms.sendingAlertThresholds)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }
  const { sendingAlertType } = await session.get(request)

  const selectedAlertThresholds = form.fields.find(field => field.name === 'alertThresholds')

  const validOptions = selectedAlertThresholds.value.map(each => JSON.parse(each))

  const selectedGroupedLicences = Object.values(groupBy(licenceGaugingStations.data.filter(eachLGS =>
    validOptions.some(
      eachOption => checkThreshold(eachLGS, eachOption) && checkAlertType(eachLGS, sendingAlertType)
    )), 'licenceId'))

  session.merge(request, {
    alertThresholds: selectedAlertThresholds,
    selectedGroupedLicences
  })

  return h.redirect(request.path.replace(/\/[^/]*$/, '/check-licence-matches'))
}

/**
 * Check that the provided licence gauging station's threshold value and unit match the provided option's threshold
 * value and unit
 */
function checkThreshold (licenceGaugingStation, option) {
  return licenceGaugingStation.thresholdValue === option.value && licenceGaugingStation.thresholdUnit === option.unit
}

/**
 * Check that the provided licence gauging station's alert type matches the provided sending alert type
 */
function checkAlertType (licenceGaugingStation, sendingAlertType) {
  const { value: sendingAlertTypeValue } = sendingAlertType
  const { alertType: lgsAlertTypeValue } = licenceGaugingStation

  // We always want to include a licence gauging station if the sending alert type is `resume` or `warning`
  if (sendingAlertTypeValue === 'resume' || sendingAlertTypeValue === 'warning') {
    return true
  }

  // We treat a licence gauging station alert type of `stop_or_reduce` as if it's `reduce`
  const normalisedLgsAlertTypeValue = lgsAlertTypeValue === 'stop_or_reduce' ? 'reduce' : lgsAlertTypeValue

  return normalisedLgsAlertTypeValue === sendingAlertTypeValue
}

const getSendAlertCheckLicenceMatches = async (request, h) => {
  const pageTitle = 'Check the licence matches for the selected thresholds'
  const caption = await helpers.getCaption(request)

  const sessionData = await session.get(request)
  const { selectedGroupedLicences } = sessionData
  if (!selectedGroupedLicences) {
    return h.redirect(request.path.replace(/\/[^/]*$/, '/alert-thresholds'))
  }
  const flattenedSelectedGroupedLicences = Object.values(selectedGroupedLicences).map(n => n.map(q => {
    return {
      ...q,
      dateStatusUpdated: n.length > 1
        ? n.reduce((a, b) =>
          a && b && (new Date(a.dateStatusUpdated) > new Date(b.dateStatusUpdated)
            ? a.dateStatusUpdated
            : b.dateStatusUpdated))
        : n[0].dateStatusUpdated
    }
  }))

  if (flattenedSelectedGroupedLicences.length === 0) {
    return h.redirect(request.path.replace(/\/[^/]*$/, '/alert-thresholds'))
  }

  return h.view('nunjucks/gauging-stations/check-licences-for-sending-alerts', {
    ...request.view,
    caption,
    pageTitle,
    customBackUrl: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/alert-thresholds`,
    selectedGroupedLicences: flattenedSelectedGroupedLicences,
    continueUrl: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/email-address`,
    excludeLicencePreURL: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/exclude-licence`
  })
}

const getSendAlertExcludeLicence = async (request, h) => {
  const sessionData = await session.get(request)
  const { selectedGroupedLicences } = sessionData
  const flattenedSelectedLicencesArray = Object.values(selectedGroupedLicences).flat()

  if (!flattenedSelectedLicencesArray.find(l => l.licenceId === request.params.licenceId)) {
    return h.redirect(`/monitoring-stations/${request.params.gaugingStationId}/send-alert/check-licence-matches`)
  }
  const pageTitle = `You're about to remove licence ${flattenedSelectedLicencesArray.find(l => l.licenceId === request.params.licenceId).licenceRef} from the send list`
  const caption = await helpers.getCaption(request)

  return h.view('nunjucks/gauging-stations/exclude-licence-for-sending-alerts', {
    ...request.view,
    caption,
    pageTitle,
    confirmURL: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/exclude-licence/${request.params.licenceId}/confirm`,
    back: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/alert-thresholds`
  })
}

const getSendAlertExcludeLicenceConfirm = async (request, h) => {
  const sessionData = await session.get(request)
  const { selectedGroupedLicences } = sessionData
  const temp = selectedGroupedLicences.filter(eachGroup => eachGroup.some(groupElement => groupElement.licenceId !== request.params.licenceId))

  session.merge(request, {
    selectedGroupedLicences: temp
  })

  return h.redirect(`/monitoring-stations/${request.params.gaugingStationId}/send-alert/check-licence-matches`)
}

const getSendAlertEmailAddress = async (request, h) => {
  const pageTitle = 'Select an email address to include in the alerts'
  const caption = await helpers.getCaption(request)

  return h.view('nunjucks/form', {
    ...request.view,
    caption,
    pageTitle,
    form: formHandler.handleFormRequest(request, linkageForms.sendingAlertEmail),
    back: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/check-licence-matches`
  })
}

const postSendAlertEmailAddress = async (request, h) => {
  const form = await formHandler.handleFormRequest(request, linkageForms.sendingAlertEmail)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const useLoggedInUserEmailAddress = form.fields.find(field => field.name === 'useLoggedInUserEmailAddress')

  const customEmailAddress = useLoggedInUserEmailAddress.value === true ? null : useLoggedInUserEmailAddress.options.choices[2].fields[0]

  session.merge(request, {
    useLoggedInUserEmailAddress,
    customEmailAddress
  })

  const preparedBatchAlertsData = await helpers.getBatchAlertData(request)

  const issuer = await helpers.getIssuer(request)

  const response = await services.water.batchNotifications.prepareWaterAbstractionAlerts(issuer, preparedBatchAlertsData)

  session.merge(request, {
    notificationEventId: response.data.id
  })

  return h.redirect(request.path.replace(/\/[^/]*$/, '/processing'))
}

const getSendAlertProcessing = async (request, h) => {
  const pageTitle = 'Processing notifications'
  const caption = await helpers.getCaption(request)

  // Check if the batch is ready yet.
  // If the batch is ready, send the user to the check page

  const { notificationEventId } = await session.get(request)

  const event = await services.water.events.findOne(notificationEventId)

  if (event.data.status === 'processing') {
    return h.view('nunjucks/gauging-stations/processing-sending-alerts', {
      ...request.view,
      caption,
      pageTitle
    })
  } else {
    return h.redirect(request.path.replace(/\/[^/]*$/, '/check'))
  }
}

const getSendAlertCheck = async (request, h) => {
  const pageTitle = 'Check the alert for each licence and send'
  const caption = await helpers.getCaption(request)

  let monitoringStationUrl = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    monitoringStationUrl = `/system${monitoringStationUrl}`
  }

  const { notificationEventId } = session.get(request)
  if (!notificationEventId) {
    return h.redirect(monitoringStationUrl)
  }
  const event = await services.water.events.findOne(notificationEventId)
  const { data: notifications } = await services.water.notifications.getNotificationMessages(notificationEventId)

  return h.view('nunjucks/gauging-stations/confirm-sending-alerts', {
    ...request.view,
    caption,
    pageTitle,
    licenceCount: event.data.licences.length,
    notifications,
    confirmAndSendUrl: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/success`,
    previewNotificationPreUrl: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/preview`,
    back: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/alert-thresholds`
  })
}

const getSendAlertPreview = async (request, h) => {
  const { notificationId } = request.params

  const { data: scheduledNotification } = await services.water.notifications.getNotificationMessage(notificationId)
  const { messageRef: template, personalisation } = scheduledNotification

  let prefix = ''
  if (template.indexOf('resume') > -1) {
    prefix = 'Resume '
  } else {
    prefix = `${personalisation.alertType.replace(/(^\w|\s\w)/g, m => m.toUpperCase()).split('_').join(' ')}${template.indexOf('warning') > -1 ? ' warning ' : ' '}`
  }
  const pageTitle = `${prefix}message preview`
  const caption = await helpers.getCaption(request)

  let path = `nunjucks/gauging-stations/letter-preview/${template}`
  if (endsWith(template, '_email')) {
    path = `nunjucks/gauging-stations/letter-preview/${template.slice(0, -6).trim()}`
  }

  return h.view(path, {
    ...request.view,
    caption,
    pageTitle,
    personalisation,
    back: `/monitoring-stations/${request.params.gaugingStationId}/send-alert/check`
  })
}

const getSendAlertConfirm = async (request, h) => {
  const pageTitle = 'Check the alert for each licence and send'
  const caption = await helpers.getCaption(request)

  let monitoringStationUrl = `/monitoring-stations/${request.params.gaugingStationId}/`

  if (featureFlags.enableMonitoringStationsView) {
    monitoringStationUrl = `/system${monitoringStationUrl}`
  }

  const { notificationEventId } = await session.get(request)
  if (!notificationEventId) {
    return h.redirect(monitoringStationUrl)
  }

  const event = await services.water.events.findOne(notificationEventId)

  const issuer = await helpers.getIssuer(request)
  try {
    await services.water.batchNotifications.sendWaterAbstractionAlerts(notificationEventId, issuer)
  } catch (e) {
    logger.warn(e)
  }
  session.clear(request)

  return h.view('nunjucks/gauging-stations/confirm-sending-successful', {
    ...request.view,
    caption,
    pageTitle,
    recipientCount: event.data.metadata.recipients,
    notificationsReportUrl: '/notifications/report',
    monitoringStationUrl
  })
}

exports.getNewTaggingFlow = getNewTaggingFlow
exports.getNewTaggingThresholdAndUnit = getNewTaggingThresholdAndUnit
exports.postNewTaggingThresholdAndUnit = postNewTaggingThresholdAndUnit
exports.getNewTaggingAlertType = getNewTaggingAlertType
exports.postNewTaggingAlertType = postNewTaggingAlertType
exports.getNewTaggingLicenceNumber = getNewTaggingLicenceNumber
exports.postNewTaggingLicenceNumber = postNewTaggingLicenceNumber
exports.getNewTaggingCondition = getNewTaggingCondition
exports.postNewTaggingCondition = postNewTaggingCondition
exports.getNewTaggingManuallyDefinedAbstractionPeriod = getNewTaggingManuallyDefinedAbstractionPeriod
exports.postNewTaggingManuallyDefinedAbstractionPeriod = postNewTaggingManuallyDefinedAbstractionPeriod
exports.getNewTaggingCheckYourAnswers = getNewTaggingCheckYourAnswers
exports.postNewTaggingCheckYourAnswers = postNewTaggingCheckYourAnswers
exports.getNewTaggingFlowComplete = getNewTaggingFlowComplete
exports.getMonitoringStation = getMonitoringStation
exports.getRemoveTags = getRemoveTags
exports.getRemoveTagComplete = getRemoveTagComplete
exports.postRemoveTagOrMultiple = postRemoveTagOrMultiple
exports.postRemoveTagComplete = postRemoveTagComplete
exports.postRemoveTagsLicenceSelected = postRemoveTagsLicenceSelected
exports.getRemoveTagsConditions = getRemoveTagsConditions
exports.getSendAlertSelectAlertType = getSendAlertSelectAlertType
exports.postSendAlertSelectAlertType = postSendAlertSelectAlertType
exports.getSendAlertSelectAlertThresholds = getSendAlertSelectAlertThresholds
exports.postSendAlertSelectAlertThresholds = postSendAlertSelectAlertThresholds
exports.getSendAlertCheckLicenceMatches = getSendAlertCheckLicenceMatches
exports.getSendAlertExcludeLicence = getSendAlertExcludeLicence
exports.getSendAlertExcludeLicenceConfirm = getSendAlertExcludeLicenceConfirm
exports.getSendAlertEmailAddress = getSendAlertEmailAddress
exports.postSendAlertEmailAddress = postSendAlertEmailAddress
exports.getSendAlertProcessing = getSendAlertProcessing
exports.getSendAlertCheck = getSendAlertCheck
exports.getSendAlertPreview = getSendAlertPreview
exports.getSendAlertConfirm = getSendAlertConfirm
