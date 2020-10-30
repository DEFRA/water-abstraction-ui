'use strict';

const Boom = require('@hapi/boom');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

exports.errorHandler = errorHandler;
