'use strict';

/**
 * Contains methods to set up/tear down acceptance test data in water service
 */
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const urlJoin = require('url-join');

/**
 * HTTP request to the water service
 * @param {String} tail
 * @return {Promise}
 */
const waterRequest = (tail) => {
  cy.log(`Calling ${tail}`);
  const url = urlJoin(Cypress.env('WATER_URI'), tail);
  cy.request({
    url,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Cypress.env('JWT_TOKEN')}`
    }
  });
  cy.log(`Called ${tail} - success!`);
};

/**
 * Sets up acceptance test data
 * @return {Promise}
 */
const setUp = (key) => waterRequest('/acceptance-tests/set-up-from-yaml/' + key);

/**
 * Tears down acceptance test data
 * @return {Promise}
 */
const tearDown = () => waterRequest('/acceptance-tests/tear-down');

exports.setUp = setUp;
exports.tearDown = tearDown;
