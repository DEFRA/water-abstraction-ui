/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { set, get } = require('lodash');
const moment = require('moment');
const { getWaterLicence } = require('../../../lib/connectors/crm/documents');
const { handleRequest, setValues, getValues } = require('../../../lib/forms');
const { amountsForm, methodForm, confirmForm, unitsForm, singleTotalForm, singleTotalSchema, basisForm, basisSchema, quantitiesForm, quantitiesSchema } = require('../forms/');
const { returns } = require('../../../lib/connectors/water');
const { applySingleTotal, applyBasis, applyQuantities, applyNilReturn } = require('../lib/return-helpers');
const { fetchReturnData, persistReturnData } = require('../lib/session-helpers');
const { getReturnTotal, isInternalUser } = require('../lib/helpers');

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  // Check start date
  if (moment(data.startDate).isBefore('2018-11-01')) {
    throw Error(`Cannot edit return ${returnId}, start date is before 01/11/2018`);
  }

  data.versionNumber = (data.versionNumber || 0) + 1;
  request.sessionStore.set('internalReturnFlow', data);

  const form = setValues(amountsForm(request), data);

  return h.view('water/returns/internal/form', {
    documentHeader,
    form,
    return: data,
    ...request.view
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(setValues(amountsForm(request), data), request);

  if (form.isValid) {
    const { isNil } = getValues(form);

    const d = applyNilReturn(data, isNil);

    request.sessionStore.set('internalReturnFlow', d);

    const path = isNil ? '/admin/return/nil-return' : '/admin/return/method';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    return: data,
    documentHeader,
    ...request.view
  });
};

/**
 * Confirmation screen for nil return
 */
const getNilReturn = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = confirmForm(request);

  return h.view('water/returns/internal/nil-return', {
    return: data,
    form,
    documentHeader,
    ...request.view
  });
};

/**
 * Confirmation screen for nil return
 */
const postNilReturn = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(confirmForm(request), request);

  const view = {
    return: data,
    documentHeader,
    form,
    ...request.view
  };

  if (form.isValid) {
    try {
      await persistReturnData(data, request);
      return h.redirect('/admin/return/submitted');
    } catch (error) {
      console.error(error);
      view.error = error;
    }
  }

  return h.view('water/returns/internal/nil-return', view);
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  // Clear session
  request.sessionStore.delete('internalReturnFlow');

  const isInternal = isInternalUser(request);
  const returnUrl = `${isInternal ? '/admin' : ''}/returns/return?id=${data.returnId} `;

  return h.view('water/returns/internal/submitted', {
    return: data,
    ...request.view,
    documentHeader,
    returnUrl
  });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = methodForm(request);

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * Post handler for routing question
 * whether user is submitting meter readings or other
 */
const postMethod = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(methodForm(request), request);

  if (form.isValid) {
    const { isMeterReadings } = getValues(form);

    const path = isMeterReadings ? `/admin/return/meter` : '/admin/return/units';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * Form to choose units
 */
const getUnits = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const units = get(data, 'reading.units');

  const form = setValues(unitsForm(request), { units });

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * Post handler for units form
 */
const postUnits = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(unitsForm(request), request);

  if (form.isValid) {
    // Persist chosen units to session
    const { units } = getValues(form);
    set(data, 'reading.units', units);
    request.sessionStore.set('internalReturnFlow', data);

    return h.redirect('/admin/return/single-total');
  }

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * Form to choose whether single figure or multiple amounts
 */
const getSingleTotal = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = singleTotalForm(request);

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * Post handler for single total
 */
const postSingleTotal = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(singleTotalForm(request), request, singleTotalSchema);

  if (form.isValid) {
    // Persist to session
    const { isSingleTotal, total } = getValues(form);

    const d = isSingleTotal ? applySingleTotal(data, total) : data;
    set(d, 'reading.totalFlag', isSingleTotal);

    request.sessionStore.set('internalReturnFlow', d);

    return h.redirect('/admin/return/basis');
  }

  return h.view('water/returns/internal/form', {
    form,
    documentHeader,
    return: data,
    ...request.view
  });
};

/**
 * What is the basis for the return - amounts/pump/herd
 */
const getBasis = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = basisForm(request);

  return h.view('water/returns/internal/form', {
    form,
    return: data,
    documentHeader,
    ...request.view
  });
};

/**
 * Post handler for basis form
 */
const postBasis = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = handleRequest(basisForm(request), request, basisSchema);

  if (form.isValid) {
    const d = applyBasis(data, getValues(form));
    request.sessionStore.set('internalReturnFlow', d);

    const path = get(d, 'reading.totalFlag') ? '/admin/return/confirm' : '/admin/return/quantities';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    return: data,
    documentHeader,
    ...request.view
  });
};

/**
 * Screen for user to enter quantities
 */
const getQuantities = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = quantitiesForm(request, data);

  return h.view('water/returns/internal/form', {
    form,
    return: data,
    documentHeader,
    ...request.view
  });
};

const postQuantities = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const schema = quantitiesSchema(data);

  const form = handleRequest(quantitiesForm(request, data), request, schema);
  if (form.isValid) {
    // Persist
    const d = applyQuantities(data, getValues(form));

    request.sessionStore.set('internalReturnFlow', d);

    return h.redirect(`/admin/return/confirm`);
  }
  return h.view('water/returns/internal/form', {
    form,
    return: data,
    documentHeader,
    ...request.view
  });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const data = fetchReturnData(request);
  const documentHeader = await getWaterLicence(data.licenceNumber);

  const form = confirmForm(request, `/admin/return/confirm`);

  return h.view('water/returns/internal/confirm', {
    return: data,
    documentHeader,
    form,
    total: getReturnTotal(data),
    ...request.view
  });
};

/**
 * Confirm return
 */
const postConfirm = async (request, h) => {
  const data = fetchReturnData(request);

  // Post return
  await persistReturnData(data, request);

  return h.redirect('/admin/return/submitted');
};

module.exports = {
  getAmounts,
  postAmounts,
  getNilReturn,
  postNilReturn,
  getSubmitted,
  getMethod,
  postMethod,
  getUnits,
  postUnits,
  getSingleTotal,
  postSingleTotal,
  getBasis,
  postBasis,
  getQuantities,
  postQuantities,
  getConfirm,
  postConfirm
};
