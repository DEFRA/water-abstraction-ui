const moment = require('moment');
const { fields } = require('shared/lib/forms');

const getContinueField = (label = 'Continue') => {
  return fields.button(null, { label });
};

const getCsrfTokenField = request => {
  const { csrfToken } = request.view;
  return fields.hidden('csrf_token', {}, csrfToken);
};

const getHeadingField = (text, element = 'h3') => {
  return fields.paragraph(null, {
    text,
    element,
    controlClass: 'govuk-heading-m' });
};

const getParagraphField = (text) => {
  return fields.paragraph(null, {
    text,
    element: 'p'
  });
};

/**
 * Get form field name
 * @param {Object} line
 * @return {String} field name
 */
const getLineName = (line) => line.startDate + '_' + line.endDate;

/**
 * Gets label text for line
 * @param {Object} line from requiredLines array
 * @return {String} label
 */
const getLineLabel = (line) => {
  if (line.timePeriod === 'day') {
    return moment(line.startDate).format('D MMMM');
  }
  if (line.timePeriod === 'week') {
    return 'Week ending ' + moment(line.endDate).format('D MMMM');
  }
  if (line.timePeriod === 'month') {
    return moment(line.startDate).format('MMMM');
  }
  if (line.timePeriod === 'year') {
    return moment(line.startDate).format('D MMMM YYYY - ') + moment(line.endDate).format('D MMMM YYYY');
  }
};

/**
 * Returns form lines
 * @param {Object} returns data model
 * @return {Array} returns lines if set and not empty, otherwise required lines
 */
const getFormLines = (data) => {
  return data.lines && data.lines.length ? data.lines : data.requiredLines;
};

exports.getContinueField = getContinueField;
exports.getCsrfTokenField = getCsrfTokenField;
exports.getHeadingField = getHeadingField;
exports.getParagraphField = getParagraphField;
exports.getLineName = getLineName;
exports.getLineLabel = getLineLabel;
exports.getFormLines = getFormLines;
