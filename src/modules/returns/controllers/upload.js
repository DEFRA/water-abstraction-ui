const { get } = require('lodash');
const waterReturns = require('../../../lib/connectors/water-service/returns');
const logger = require('../../../lib/logger');
const confirmForm = require('../forms/confirm-upload');
const uploadHelpers = require('../lib/return-upload-helpers');

const pageTitles = {
  ok: 'Your data is ready to send',
  error: 'There are some problems with your data'
};

const hasErrors = grouped => get(grouped, 'returnsWithErrors.length') > 0;

/**
 * A page to show a summary of the data before it is submitted
 * @param  {String} request.params.eventId
 */
const getSummary = async (request, h) => {
  const { eventId } = request.params;
  const options = uploadHelpers.mapRequestOptions(request);
  try {
    const returns = await waterReturns.getUploadPreview(eventId, options);

    const grouped = uploadHelpers.groupReturns(returns, eventId);
    const form = confirmForm(request, grouped.returnsWithoutErrors.length);

    const view = {
      back: '/returns/upload',
      ...request.view,
      ...grouped,
      form,
      pageTitle: hasErrors(grouped) ? pageTitles.error : pageTitles.ok
    };

    return h.view('nunjucks/returns/upload-summary.njk', view, { layout: false });
  } catch (err) {
    const params = { eventId, options };
    logger.error(`Return upload error`, params);
    throw err;
  }
};

/**
 * A page to preview a single uploaded return before submission
 * together with its metadata and all quantity lines
 * @param  {String} request.params.eventId - the upload event ID
 * @param {String} request.params.returnId - the return service ID to display
 */
const getSummaryReturn = async (request, h) => {
  const { eventId, returnId } = request.params;
  const options = uploadHelpers.mapRequestOptions(request);
  try {
    const ret = await waterReturns.getUploadPreview(eventId, options, returnId);

    const returnData = uploadHelpers.mapReturn(ret, eventId);

    const view = {
      back: `/returns/upload-summary/${eventId}`,
      ...request.view,
      return: returnData,
      pageTitle: `Check your return reference ${returnData.returnRequirement}`,
      lines: uploadHelpers.groupLines(ret)
    };

    return h.view('nunjucks/returns/upload-return.njk', view, { layout: false });
  } catch (err) {
    const params = { eventId, returnId, options };
    logger.error(`Return upload error`, params);
    throw err;
  }
};

exports.getSummary = getSummary;
exports.getSummaryReturn = getSummaryReturn;
exports.pageTitles = pageTitles;
