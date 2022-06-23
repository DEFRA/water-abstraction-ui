'use strict'

const { get } = require('lodash')
const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')
const addressMapper = require('shared/lib/mappers/address')
const { NEW_BILLING_ACCOUNT } = require('../lib/constants')

const isCurrentAddress = invoiceAccountAddress => invoiceAccountAddress.dateRange.endDate === null

/**
 * Creates an array of specification objects to use for the choices where
 * the id/value is the address id and the label is a string of HTML
 * containing the account number and name, followed by a single line
 * address
 *
 * @param {Array} accounts
 */
const mapBillingAccountsToChoices = accounts => accounts.map(account => {
  const currentAddress = account.invoiceAccountAddresses.find(isCurrentAddress)

  const displayCompany = (currentAddress && currentAddress.agentCompany) || account.company

  const lines = [`${account.accountNumber} - ${displayCompany.name}`]
  if (currentAddress) {
    lines.push(addressMapper.mapAddressToString(currentAddress.address))
  }
  return { html: lines.join('<br>'), value: account.id }
})

const selectBillingAccountForm = request => {
  const { csrfToken } = request.view
  const { billingAccounts, sessionData } = request.pre
  const billingAccountId = get(sessionData, 'data.id')

  const f = formFactory(request.path)

  f.fields.push(fields.radio('billingAccountId', {
    errors: {
      'any.required': {
        message: 'Select a billing account or set up a new one'
      }
    },
    choices: [
      ...mapBillingAccountsToChoices(billingAccounts),
      { divider: 'or' },
      { label: 'Set up a new billing account', value: NEW_BILLING_ACCOUNT }
    ]
  }, billingAccountId))

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const selectBillingAccountSchema = request => {
  const { billingAccounts } = request.pre
  const validIds = billingAccounts.map(account => account.id)

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    billingAccountId: Joi.string().required().valid(...validIds).allow(NEW_BILLING_ACCOUNT)
  })
}

exports.form = selectBillingAccountForm
exports.schema = selectBillingAccountSchema
