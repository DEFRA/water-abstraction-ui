const { APIClient } = require('@envage/hapi-pg-rest-api');
const http = require('./http');

const create = endpoint => {
  return new APIClient(http.request, {
    endpoint,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
};

exports.create = create;
