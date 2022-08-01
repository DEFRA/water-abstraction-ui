const { find } = require('lodash')
const { handleRequest, getValues } = require('shared/lib/forms')
const { mapRequestData } = require('shared/lib/forms/validationAdapters/json-schema')
const { mapARItem, getSchemaCategories, getSchemaCategory, getWR22 } = require('@envage/water-abstraction-helpers').digitise
const { selectSchemaCategoryForm, selectSchemaCategoryFormSchema } = require('../forms/select-schema-category')
const { selectSchemaForm, selectSchemaFormSchema } = require('../forms/select-schema')
const { load } = require('../lib/loader')
const { getPermissions } = require('../lib/permissions')
const { diff } = require('../lib/diff')

const wr22Helpers = require('../lib/wr22-helpers')

const {
  findDataItem, getEditFormAndSchema, getAddFormAndSchema,
  addActionFactory, editActionFactory, persistActions, getSchema
} = wr22Helpers

const { deleteForm } = require('../forms/delete')

const { createDeleteData } = require('../lib/action-creators')

/**
 * Pre handler for all routes
 * @param  {Object}  request - HAPI request
 * @param {String} request.params.documentId - the document header ID
 * @param  {Object}  h       - HAPI reply toolkit
 * @return {Promise}         resolves with continue/redirect response
 */
const pre = async (request, h) => {
  const { documentId } = request.params

  // Load licence / AR licence from CRM
  const { licence, arLicence, finalState } = await load(documentId)

  request.licence = licence
  request.arLicence = arLicence
  request.finalState = finalState
  request.wr22Schema = getWR22()
  request.categories = getSchemaCategories(request.wr22Schema)

  // Check permissions
  const { canEdit } = getPermissions(request, finalState)
  if (!canEdit) {
    return h.redirect(`/digitise/licence/${documentId}?flash=locked`).takeover()
  }

  return h.continue
}

/**
 * There are a large number of WR22 conditions to choose from - this screen
 * lets the user select the category first before being presented with a
 * filtered list
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const getSelectSchemaCategory = async (request, h) => {
  const { categories } = request
  const { documentId } = request.params

  const form = request.form || selectSchemaCategoryForm(request, categories)

  const view = {
    categories,
    ...request.view,
    form,
    back: `/digitise/licence/${documentId}#further-conditions`
  }

  return h.view('nunjucks/abstraction-reform/select-schema-category', view)
}

const postSelectSchemaCategory = async (request, h) => {
  const { documentId } = request.params

  const form = handleRequest(selectSchemaCategoryForm(request, request.categories), request, selectSchemaCategoryFormSchema)

  if (form.isValid) {
    const { category } = getValues(form)

    const path = `/digitise/licence/${documentId}/select-schema/${category}`
    return h.redirect(path)
  } else {
    // Re-display form with validation errors
    request.form = form
    return getSelectSchemaCategory(request, h)
  }
}

/**
 * A screen to select a custom data point schema (WR22) to add to existing licence
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const getSelectSchema = async (request, h) => {
  const { documentId, slug } = request.params

  const category = find(request.categories, { slug })
  const form = request.form || selectSchemaForm(request, request.wr22Schema, category)

  const view = {
    category,
    ...request.view,
    form,
    back: `/digitise/licence/${documentId}/select-schema-category`
  }

  return h.view('nunjucks/abstraction-reform/select-schema', view)
}

/**
 * Post handler for adding new WR22 schema to licence data
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const postSelectSchema = async (request, h) => {
  const { documentId, slug } = request.params

  const category = find(request.categories, { slug })

  const form = handleRequest(selectSchemaForm(request, request.wr22Schema, category), request, selectSchemaFormSchema)

  // If validation errors in form, redisplay with error message
  if (!form.isValid) {
    request.form = form
    return getSelectSchema(request, h)
  }

  // Otherwise redirect to data capture form
  const { schema } = getValues(form)

  const path = `/digitise/licence/${documentId}/add-data/${schema}`

  return h.redirect(path)
}

/**
 * Render form to enter data for WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with page content
 */
const getAddData = async (request, h) => {
  const { documentId } = request.params

  const { form, schema } = await getAddFormAndSchema(request)

  const { slug } = getSchemaCategory(request.categories, schema.id)

  const view = {
    ...request.view,
    form: request.form || form,
    schema,
    back: `/digitise/licence/${documentId}/select-schema/${slug}`
  }
  return h.view('nunjucks/abstraction-reform/edit-data', view)
}

/**
 * Maps data from form to data ready for storing in AR permit
 * @param  {Object} form   - form object
 * @param  {Object} schema - JSON schema object
 * @return {Object}        nested data
 */
const getData = (form, schema) => {
  const values = getValues(form)
  return mapRequestData(values, schema)
}

/**
 * POST handler for form to enter data for WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with page content
 */
const postAddData = async (request, h) => {
  const { documentId } = request.params

  const { form, schema } = await getAddFormAndSchema(request)

  const f = handleRequest(form, request, schema)

  if (f.isValid) {
    const add = addActionFactory(request, request.licence)
    const { id } = add.payload
    const edit = editActionFactory(request, getData(f, schema), id)
    const actions = [add, edit]

    await persistActions(request.licence, request.arLicence, actions)

    return h.redirect(`/digitise/licence/${documentId}#${id}`)
  } else {
    request.form = f
    return getAddData(request, h)
  }
}

/**
 * Edit existing data item
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI reply
 * @return {Promise}         resolves with rendered form
 */
const getEditData = async (request, h) => {
  const { documentId, id } = request.params
  const { schema, form } = await getEditFormAndSchema(request)

  const view = {
    ...request.view,
    form: request.form || form,
    schema,
    back: `/digitise/licence/${documentId}#${id}`
  }

  return h.view('nunjucks/abstraction-reform/edit-data', view)
}

/**
 * Post handler to edit a WR22 condition
 * A diff is performed so that only modified fields are stored as part of the edit
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with redirect on success,
 *                           or displays form again with errors
 */
const postEditData = async (request, h) => {
  const { id, documentId } = request.params

  const { schema, form } = await getEditFormAndSchema(request)

  const updated = handleRequest(form, request, schema)

  if (updated.isValid) {
    // Get existing data item
    const item = findDataItem(request.finalState, id)

    // Nest submitted form data and diff with current data
    const data = diff(item.content, getData(updated, schema))

    // Persist if there are changes
    if (data) {
      const edit = editActionFactory(request, data, id)
      await persistActions(request.licence, request.arLicence, [edit])
    }

    return h.redirect(`/digitise/licence/${documentId}#${id}`)
  } else {
    request.form = updated
    return getEditData(request, h)
  }
}

/**
 * Shows a form so the user can confirm deletion of a WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with condition detail and delete form
 */
const getDeleteData = async (request, h) => {
  const { id } = request.params

  // Get data point
  const data = findDataItem(request.finalState, id)
  const schema = getSchema(data.schema)

  // Create form object
  const form = deleteForm(request)

  const view = {
    ...request.view,
    data: mapARItem(data),
    schema,
    form
  }

  return h.view('nunjucks/abstraction-reform/delete', view)
}

/**
 * Post handler to delete WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with redirect to licence page
 */
const postDeleteData = async (request, h) => {
  const { id, documentId } = request.params

  const action = createDeleteData(request.defra, id)
  await wr22Helpers.persistActions(request.licence, request.arLicence, [action])
  return h.redirect(`/digitise/licence/${documentId}#further-conditions`)
}

module.exports = {
  pre,
  getSelectSchemaCategory,
  postSelectSchemaCategory,
  getSelectSchema,
  postSelectSchema,
  getAddData,
  postAddData,
  getEditData,
  postEditData,
  getDeleteData,
  postDeleteData
}
