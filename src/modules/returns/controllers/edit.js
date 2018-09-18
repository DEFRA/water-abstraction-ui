/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { set, get } = require('lodash');
const Boom = require('boom');
const { getWaterLicence } = require('../../../lib/connectors/crm/documents');
const { handleRequest, setValues, getValues } = require('../../../lib/forms');
const { amountsForm, methodForm, confirmForm, unitsForm, singleTotalForm, singleTotalSchema, basisForm, basisSchema, quantitiesForm, quantitiesSchema } = require('../forms/');
const { returns } = require('../../../lib/connectors/water');
const { applySingleTotal, applyBasis, applyQuantities, applyNilReturn, applyExternalUser } = require('../lib/return-helpers');
const {
  getSessionData,
  saveSessionData,
  deleteSessionData,
  submitReturnData } = require('../lib/session-helpers');
const { getLicenceNumbers, getReturnTotal, getScopedPath, canEdit } = require('../lib/helpers');

/**
 * Get common view data used by many controllers
 * @param {Object} HAPI request instance
 * @param {Object} data - the return model
 * @return {Promise} resolves with view data
 */
const getViewData = async (request, data) => {
  const documentHeader = await getWaterLicence(data.licenceNumber);
  const isInternal = request.permissions.hasPermission('admin.defra');
  return {
    ...request.view,
    documentHeader,
    data,
    activeNavLink: isInternal ? 'view' : 'returns'
  };
};

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);

  // Check CRM ownership of document
  const { entity_id: entityId } = request.auth.credentials;
  const isInternal = request.permissions.hasPermission('admin.defra');
  const documentHeaders = await getLicenceNumbers(entityId, { system_external_id: data.licenceNumber }, isInternal);
  if (documentHeaders.length === 0) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId} for entity ${entityId}`);
  }

  // Check date/roles
  if (!canEdit(request.permissions, data)) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId} for entity ${entityId}`);
  }

  const view = await getViewData(request, data);

  data.versionNumber = (data.versionNumber || 0) + 1;
  saveSessionData(request, applyExternalUser(data));

  const form = setValues(amountsForm(request), data);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const data = getSessionData(request);

  const view = await getViewData(request, data);

  const form = handleRequest(setValues(amountsForm(request), data), request);

  if (form.isValid) {
    const { isNil } = getValues(form);

    const d = applyNilReturn(data, isNil);

    saveSessionData(request, d);

    const path = isNil ? '/return/nil-return' : '/return/method';
    return h.redirect(getScopedPath(request, path));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Confirmation screen for nil return
 */
const getNilReturn = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = confirmForm(request);

  return h.view('water/returns/internal/nil-return', {
    ...view,
    return: data,
    form
  });
};

/**
 * Confirmation screen for nil return
 */
const postNilReturn = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = handleRequest(confirmForm(request), request);

  if (form.isValid) {
    try {
      await submitReturnData(data, request);
      return h.redirect(getScopedPath(request, '/return/submitted'));
    } catch (error) {
      console.error(error);
      view.error = error;
    }
  }

  return h.view('water/returns/internal/nil-return', {
    ...view,
    return: data,
    form
  });
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  // Clear session
  deleteSessionData(request);

  const isInternal = request.permissions.hasPermission('admin.defra');
  const returnUrl = `${isInternal ? '/admin' : ''}/returns/return?id=${data.returnId} `;

  return h.view('water/returns/internal/submitted', {
    ...view,
    return: data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil' : ''} submitted`
  });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = methodForm(request);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Post handler for routing question
 * whether user is submitting meter readings or other
 */
const postMethod = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = handleRequest(methodForm(request), request);

  if (form.isValid) {
    const { method } = getValues(form);

    const paths = {
      oneMeter: `/return/meter`,
      multipleMeters: `/return/multiple-meters`,
      abstractionVolumes: `/return/units`
    };

    return h.redirect(getScopedPath(request, paths[method]));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Message about multiple meters not being supported
 */
const getMultipleMeters = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  return h.view('water/returns/internal/multiple-meters', {
    ...view,
    return: data
  });
};

/**
 * Form to choose units
 */
const getUnits = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const units = get(data, 'reading.units');

  const form = setValues(unitsForm(request), { units });

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Post handler for units form
 */
const postUnits = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = handleRequest(unitsForm(request), request);

  if (form.isValid) {
    // Persist chosen units to session
    const { units } = getValues(form);
    set(data, 'reading.units', units);
    saveSessionData(request, data);

    // Only internal staff have screen for single total
    const isInternal = request.permissions.hasPermission('admin.defra');
    const path = isInternal ? '/return/single-total' : '/return/basis';

    return h.redirect(getScopedPath(request, path));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Form to choose whether single figure or multiple amounts
 */
const getSingleTotal = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = singleTotalForm(request);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Post handler for single total
 */
const postSingleTotal = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = handleRequest(singleTotalForm(request), request, singleTotalSchema);

  if (form.isValid) {
    // Persist to session
    const { isSingleTotal, total } = getValues(form);

    const d = isSingleTotal ? applySingleTotal(data, total) : data;
    set(d, 'reading.totalFlag', isSingleTotal);

    saveSessionData(request, d);

    return h.redirect(getScopedPath(request, '/return/basis'));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * What is the basis for the return - amounts/pump/herd
 */
const getBasis = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = basisForm(request);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Post handler for basis form
 */
const postBasis = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = handleRequest(basisForm(request), request, basisSchema);

  if (form.isValid) {
    const d = applyBasis(data, getValues(form));
    saveSessionData(request, d);

    const path = get(d, 'reading.totalFlag') ? '/return/confirm' : '/return/quantities';
    return h.redirect(getScopedPath(request, path));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Screen for user to enter quantities
 */
const getQuantities = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = quantitiesForm(request, data);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

const postQuantities = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const schema = quantitiesSchema(data);

  const form = handleRequest(quantitiesForm(request, data), request, schema);
  if (form.isValid) {
    // Persist
    const d = applyQuantities(data, getValues(form));

    saveSessionData(request, d);

    return h.redirect(getScopedPath(request, `/return/confirm`));
  }
  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const data = getSessionData(request);
  const view = await getViewData(request, data);

  const form = confirmForm(request, `/return/confirm`);

  return h.view('water/returns/internal/confirm', {
    ...view,
    return: data,
    form,
    total: getReturnTotal(data)
  });
};

/**
 * Confirm return
 */
const postConfirm = async (request, h) => {
  const data = getSessionData(request);

  // Post return
  await submitReturnData(data, request);

  return h.redirect(getScopedPath(request, '/return/submitted'));
};

module.exports = {
  getAmounts,
  postAmounts,
  getNilReturn,
  postNilReturn,
  getSubmitted,
  getMethod,
  postMethod,
  getMultipleMeters,
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
