// contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const isArray = require('lodash/isArray');

/**
 * Formats a Joi error to a simple object which can easily be used in a
 * Handlebars template.
 * The field name and the validation that failed are converted into a string
 * which can then be tested in the view, e.g. {# if error.password_min }...
 *
 * The output is e.g.:  { password_min : true, confirmPassword_empty : true }
 * @param {Object} Joi error
 * @return {Object}
 */
const formatViewError = (error) => {
  if (!error.isJoi) {
    return error;
  }
  return error.details.reduce((memo, detail) => {
    memo[detail.path.join('_') + '_' + detail.type.split('.')[1]] = true;
    return memo;
  }, {});
};

/**
 * Force value to be array
 * @param {Mixed} val - the value
 * @return {Array} the value wrapped in array
 */
function forceArray (val) {
  if (val === null || val === undefined) {
    return [];
  }
  return isArray(val) ? val : [val];
}

// make a simple http request (without a body), uses promises
function makeURIRequest (uri) {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'get',
      uri: uri
    };
    rp(options)
      .then(function (response) {
        var responseData = {};
        responseData.error = null;
        responseData.statusCode = 200;
        responseData.body = response;
        resolve(responseData);
      })
      .catch(function (response) {
        var responseData = {};
        responseData.error = response.error;
        responseData.statusCode = response.statusCode;
        responseData.body = response.body;
        reject(responseData);
      });
  });
}

// make an http request (with a body), uses promises
function makeURIRequestWithBody (uri, method, data) {
  return new Promise((resolve, reject) => {
    var options = {
      method: method,
      uri: uri,
      body: data,
      json: true
    };

    rp(options)
      .then(function (response) {
        var responseData = {};
        responseData.error = null;
        responseData.statusCode = 200;
        responseData.body = response;
        resolve(responseData);
      })
      .catch(function (response) {
        var responseData = {};
        responseData.error = response.error;
        responseData.statusCode = response.statusCode;
        responseData.body = response.body;
        reject(responseData);
      });
  });
}

// create a UUID
function createGUID () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

module.exports = {
  createGUID: createGUID,
  makeURIRequest: makeURIRequest,
  makeURIRequestWithBody: makeURIRequestWithBody,
  forceArray,
  formatViewError

};
