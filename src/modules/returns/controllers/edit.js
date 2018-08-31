/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { set, get } = require('lodash');
const { handleRequest, setValues, getValues } = require('../../../lib/forms');
const { amountsForm, methodForm, confirmForm, unitsForm, singleTotalForm, singleTotalSchema, basisForm, basisSchema, quantitiesForm, quantitiesSchema } = require('../forms/');
const { returns } = require('../../../lib/connectors/water');
const { applySingleTotal, applyBasis, applyQuantities } = require('../lib/return-helpers');

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  request.sessionStore.set('internalReturnFlow', data);

  const form = setValues(amountsForm(request), data);

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(setValues(amountsForm(request), data), request);

  if (form.isValid) {
    const { isNil } = getValues(form);
    // Persist
    data.isNil = isNil;
    request.sessionStore.set('internalReturnFlow', data);

    const path = isNil ? '/admin/return/nil-return' : '/admin/return/method';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    ...request.view
  });
};

/**
 * Confirmation screen for nil return
 */
const getNilReturn = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = confirmForm(request);

  return h.view('water/returns/internal/nil-return', {
    ...data,
    form,
    ...request.view
  });
};

/**
 * Confirmation screen for nil return
 */
const postNilReturn = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(confirmForm(request), request);

  const view = {
    ...data,
    form,
    ...request.view
  };

  if (form.isValid) {
    try {
      await returns.postReturn(data);
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
  const data = request.sessionStore.get('internalReturnFlow');
  return h.view('water/returns/internal/submitted', {
    ...data,
    ...request.view,
    returnUrl: `/admin/return/view?returnId=${data.returnId}`
  });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = methodForm(request);

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for routing question
 * whether user is submitting meter readings or other
 */
const postMethod = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(methodForm(request), request);

  if (form.isValid) {
    const { isMeterReadings } = getValues(form);

    const path = isMeterReadings ? `/admin/return/meter` : '/admin/return/units';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Form to choose units
 */
const getUnits = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const { units } = data.reading;

  const form = setValues(unitsForm(request), { units });

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for units form
 */
const postUnits = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(unitsForm(request), request);

  if (form.isValid) {
    // Persist chosen units to session
    const { units } = getValues(form);
    data.reading.units = units;
    request.sessionStore.set('internalReturnFlow', data);

    return h.redirect('/admin/return/single-total');
  }

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Form to choose whether single figure or multiple amounts
 */
const getSingleTotal = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = singleTotalForm(request);

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for single total
 */
const postSingleTotal = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(singleTotalForm(request), request, singleTotalSchema);

  console.log(JSON.stringify(form, null, 2));
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
    ...data,
    ...request.view
  });
};

/**
 * What is the basis for the return - amounts/pump/herd
 */
const getBasis = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = basisForm(request);

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Post handler for basis form
 */
const postBasis = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = handleRequest(basisForm(request), request, basisSchema);

  if (form.isValid) {
    const d = applyBasis(data, getValues(form));
    request.sessionStore.set('internalReturnFlow', d);

    const path = get(d, 'reading.totalFlag') ? '/admin/return/confirm' : '/admin/return/quantities';
    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

/**
 * Screen for user to enter quantities
 */
const getQuantities = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = quantitiesForm(request, data);

  return h.view('water/returns/internal/form', {
    form,
    ...data,
    ...request.view
  });
};

const postQuantities = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

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
    ...data,
    ...request.view
  });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = confirmForm(request, `/admin/return/confirm`);

  return h.view('water/returns/internal/confirm', {
    ...data,
    form,
    ...request.view
  });
};

/**
 * Confirm return
 */
const postConfirm = async (request, h) => {
  const data = request.sessionStore.get('internalReturnFlow');

  const form = confirmForm(request, `/admin/return/confirm`);

  const view = {
    ...request.view,
    ...data,
    form
  };

  try {
    await returns.postReturn(data);
    return h.redirect('/admin/return/submitted');
  } catch (error) {
    console.error(error);
    view.error = error;
  }

  return h.view('water/returns/internal/confirm', view);
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
