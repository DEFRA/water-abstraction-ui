'use strict'

const { omit, add } = require('lodash')

const forms = require('shared/lib/forms')
const { addressSources } = require('shared/lib/constants')
const session = require('./lib/session')
const routing = require('./lib/routing')
const { NEW_ADDRESS } = require('./lib/constants')
const addressForms = require('./forms')
const { handleFormRequest } = require('shared/lib/form-handler')
const preHandlers = require('./pre-handlers')

const getDefaultView = request => {
  const { sessionData: { caption, back } } = request.pre
  return {
    ...request.view,
    back,
    caption
  }
}

/**
 * Search by postcode and display results
 */
const getPostcode = async (request, h) => {
  const { key } = request.params
  const postcodeForm = handleFormRequest(request, addressForms.ukPostcode)
  const selectAddressForm = handleFormRequest(request, addressForms.selectAddress)

  // NOTE: This is a solution for an edge case, and necessary because of the inflexibility of the custom form engine
  // that has been built into the app. The scenario is
  //
  // - user submits a postcode
  // - we return the results in the select address page
  // - user hits submit without selecting an address
  //
  // When this happens postSelectAddress() will add the error to the form object then stash the whole form in the
  // session (this is how the engine works!! Check out src/shared/lib/session-forms.js). Prior to PR #2062 they would
  // have also used the pre-handler searchForAddressesByPostcode() to find matching addresses whether the user had
  // selected one or not. The results would then have been stashed with the form in the session as well. But we had to
  // stop this because the redirect to getPostcode() within a few milliseconds was hitting the Address facades rate
  // limit causing an error. So, now the stashed form has no addresses.
  //
  // This controller still uses the pre-handler searchForAddressesByPostcode() because it always needs them.
  // So, to handle this edge case we now do a check to see if the form we get back from handleFormRequest() is the
  // stashed one with an error. If it is we apply the address results we have to it, so the lookup is re-populated.
  const addresses = request.pre.addressSearchResults || []
  if (selectAddressForm.errors.length > 0) {
    selectAddressForm.fields[0].options.choices = addressForms.selectAddress.getAddressChoices(addresses)
  }

  // If valid postcode, select available addresses
  const isPostcodeSelected = [postcodeForm.isValid, selectAddressForm.isSubmitted].includes(true)
  if (isPostcodeSelected) {
    const { postcode } = forms.getValues(selectAddressForm)

    return h.view('nunjucks/address-entry/select-address', {
      ...getDefaultView(request),
      back: routing.getPostcode(key),
      pageTitle: 'Select the address',
      form: selectAddressForm,
      postcode
    })
  }

  // Otherwise display postcode form
  return h.view('nunjucks/address-entry/enter-uk-postcode', {
    ...getDefaultView(request),
    pageTitle: 'Enter the UK postcode',
    form: postcodeForm
  })
}

/**
 * Post handler for selecting address
 */
const postSelectAddress = async (request, h) => {
  const form = handleFormRequest(request, addressForms.selectAddress)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { key } = request.params

  // NOTE: It _is_ odd to call the pre-handler here. But this is all to stop thrashing the Address facade, especially
  // if there is an issue with what the user submitted as this would cause an immediate redirect back to getPostcode()
  // which also uses the pre-handler.
  const addressSearchResults = await preHandlers.searchForAddressesByPostcode(request)
  const { uprn } = forms.getValues(form)

  const selectedAddress = addressSearchResults.find(address => address.uprn === parseInt(uprn))
  const { redirectPath } = session.merge(request, key, { data: selectedAddress })

  return h.redirect(redirectPath)
}

/**
 * Display manual address entry form
 */
const getManualAddressEntry = (request, h) => h.view('nunjucks/form', {
  ...getDefaultView(request),
  pageTitle: 'Enter the address',
  back: routing.getPostcode(request.params.key, request.query),
  form: handleFormRequest(request, addressForms.manualAddressEntry)
})

/**
 * Post handler for manual address entry form
 */
const postManualAddressEntry = (request, h) => {
  const form = handleFormRequest(request, addressForms.manualAddressEntry)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const data = {
    source: addressSources.wrls,
    uprn: null,
    ...omit(forms.getValues(form), 'csrf_token')
  }

  const { key } = request.params
  const { redirectPath } = session.merge(request, key, { data })
  return h.redirect(redirectPath)
}

/**
 * Display form to select existing company address
 */
const getSelectCompanyAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.selectCompanyAddress)

  // If there are no existing addresses redirect to postcode search
  if (request.pre.addresses.length === 0) {
    return h.redirect(routing.getPostcode(request.params.key))
  }

  return h.view('nunjucks/form', {
    ...getDefaultView(request),
    pageTitle: `Select an existing address for ${request.pre.company.name}`,
    form
  })
}

const getAddress = row => row.address

/**
 * Post handler for select existing company address
 */
const postSelectCompanyAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.selectCompanyAddress)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { key } = request.params
  const { selectedAddress } = forms.getValues(form)

  if (selectedAddress === NEW_ADDRESS) {
    return h.redirect(routing.getPostcode(key))
  }

  // Find address in array
  const data = request.pre.addresses
    .map(getAddress)
    .find(row => row.id === selectedAddress)

  // Set address in session and redirect back to parent flow
  const { redirectPath } = session.merge(request, key, { data })
  return h.redirect(redirectPath)
}

/**
 * Display form with registered company address
 */
const getUseRegisteredAddress = (request, h) => h.view('nunjucks/address-entry/use-registered-address', {
  ...getDefaultView(request),
  pageTitle: 'Registered office address',
  form: handleFormRequest(request, addressForms.useRegisteredAddress),
  address: request.pre.company.address
})

/**
 * Post handler for registered company address form
 */
const postUseRegisteredAddress = (request, h) => {
  const form = handleFormRequest(request, addressForms.useRegisteredAddress)
  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  const { key } = request.params
  const { useRegisteredAddress } = forms.getValues(form)

  if (useRegisteredAddress) {
    // Set address in session and redirect back to parent flow
    const { redirectPath } = session.merge(request, key, { data: request.pre.company.address })
    return h.redirect(redirectPath)
  }

  // Set a custom address instead
  return h.redirect(routing.getPostcode(key))
}

exports.getPostcode = getPostcode
exports.postSelectAddress = postSelectAddress

exports.getManualAddressEntry = getManualAddressEntry
exports.postManualAddressEntry = postManualAddressEntry

exports.getSelectCompanyAddress = getSelectCompanyAddress
exports.postSelectCompanyAddress = postSelectCompanyAddress

exports.getUseRegisteredAddress = getUseRegisteredAddress
exports.postUseRegisteredAddress = postUseRegisteredAddress
