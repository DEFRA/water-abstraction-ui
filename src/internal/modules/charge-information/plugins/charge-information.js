'use strict'

const sessionHelpers = require('shared/lib/session-helpers')
const { isEmpty } = require('lodash')
/**
 * A hapi plugin to get/set an object from the cache for creating
 * a new charge version
 */

const getSessionKey = (licenceId, chargeVersionWorkflowId) => {
  const key = isEmpty(chargeVersionWorkflowId) ? licenceId : `${licenceId}-${chargeVersionWorkflowId}`
  return `draftChargeInformation.${key}`
}

const generateChargeVersion = () => ({
  changeReason: null,
  dateRange: {
    startDate: null
  },
  chargeElements: [],
  invoiceAccount: null
})

const getDraftChargeInformation = function (licenceId, chargeVersionWorkflowId) {
  const key = getSessionKey(licenceId, chargeVersionWorkflowId)
  const draftChargeInfo = this.yar.get(key)
  return draftChargeInfo || generateChargeVersion()
}

const setDraftChargeInformation = function (licenceId, chargeVersionWorkflowId, data) {
  sessionHelpers.saveToSession(this, getSessionKey(licenceId, chargeVersionWorkflowId), data)
}

const clearDraftChargeInformation = function (licenceId, chargeVersionWorkflowId) {
  this.yar.clear(getSessionKey(licenceId, chargeVersionWorkflowId))
}

const chargeInformationPlugin = {
  register: server => {
    server.decorate('request', 'getDraftChargeInformation', getDraftChargeInformation)
    server.decorate('request', 'setDraftChargeInformation', setDraftChargeInformation)
    server.decorate('request', 'clearDraftChargeInformation', clearDraftChargeInformation)
  },

  pkg: {
    name: 'chargeInformationPlugin',
    version: '1.0.0'
  }
}

module.exports = chargeInformationPlugin
module.exports._getDraftChargeInformation = getDraftChargeInformation
module.exports._setDraftChargeInformation = setDraftChargeInformation
module.exports._clearDraftChargeInformation = clearDraftChargeInformation
module.exports._generateChargeVersion = generateChargeVersion
