'use strict';

/* eslint-disable no-undef */

/**
 * Gets "Continue" button, or button with specified text
 * @param {String} [text] - button text
 */
const getButton = (text = 'Continue') =>
  $(`.govuk-button=${text}`);

/**
 * Gets main page title in h1 tag
 */
const getPageTitle = () => $('h1');

/**
 * Gets caption with class govuk-caption-l
 */
const getPageCaption = () => $('govuk-caption-l');

/**
 * Gets the validation summary message.
 * Where there is more than 1 error, an index can be supplied to get
 * the message with the supplied index
 * @param {Number} [index] - index of validation summary error message
 */
const getValidationSummaryMessage = (index = 0) =>
  $('ul.govuk-error-summary__list').$$('li')[index];

/**
 * Gets the element with specified data-test-id id
 * This can be useful if it is difficult to target an element otherwise
 * E.g. <a href="/path" data-test-id="my-link">Some link</a>
 * @param {String} id
 */
const getByTestId = id =>
  $(`[data-test-id=${id}]`);

exports.getButton = getButton;
exports.getPageTitle = getPageTitle;
exports.getPageCaption = getPageCaption;
exports.getValidationSummaryMessage = getValidationSummaryMessage;
exports.getByTestId = getByTestId;
