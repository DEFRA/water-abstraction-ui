'use strict'
const confirmForm = require('shared/lib/forms/confirm-form')

/**
 * Creates an object to represent the form for confirming
 * or cancelling a billing batch
 *
 * @param {Object} request The Hapi request object
 * @param  {String} batchAction 'confirm' or 'cancel'
  */
const form = (request, batchAction) => {
  const { batchId } = request.params
  const action = `/billing/batch/${batchId}/${batchAction}`
  const buttonText = batchAction === 'confirm' ? 'Send bill run' : 'Cancel bill run'
  return confirmForm.form(request, buttonText, action)
}

exports.cancelOrConfirmBatchForm = form
