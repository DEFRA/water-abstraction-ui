const UsersAPIClient = require('./UsersAPIClient');
const { request } = require('shared/lib/connectors/http');

module.exports = config => ({
  users: new UsersAPIClient(request, {
    endpoint: `${config.services.idm}/user`,
    headers: {
      Authorization: config.jwt.token
    },
    application: config.idm.application
  })
});
