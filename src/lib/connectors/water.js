const Helpers = require('../helpers');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const { APIClient } = require('hapi-pg-rest-api');

function sendNotifyMessage (message_ref, recipient, personalisation) {
  return new Promise((resolve, reject) => {
    var uri = `${process.env.WATER_URI}/notify/${message_ref}?token=${process.env.JWT_TOKEN}`;
    var requestBody = {
      recipient: recipient,
      personalisation: personalisation
    };
    Helpers.makeURIRequestWithBody(
      uri,
      'post',
      requestBody)
      .then((response) => {
        var data = response.body;
        resolve(data);
      }).catch((response) => {
        console.log(response);
        resolve(response);
      });
  });
}

const pendingImport = new APIClient(rp, {
  endpoint: `${process.env.WATER_URI}/pending_import`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const lookup = new APIClient(rp, {
  endpoint: `${process.env.WATER_URI}/lookup`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const taskConfig = new APIClient(rp, {
  endpoint: `${process.env.WATER_URI}/taskConfig`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Send/preview notifications.  Builds de-duped contact list and renders templates
 * @param {Number} taskConfigId - the task ID in the water service task_config table
 * @param {Array} licenceNumbers - an array of licence numbers
 * @param {Object} params - user-entered template parameters
 * @param {String} sender - email address of sender.  If not supplied, reverts to preview mode
 * @return {Promise} resolves with an array of contacts, each with licence numbers and rendered templates attached
 */
const sendNotification = function (taskConfigId, licenceNumbers, params = {}, sender = null) {
  const options = {
    uri: `${process.env.WATER_URI}/notification/${sender ? 'send' : 'preview'}`,
    method: 'POST',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body: {
      filter: {
        system_external_id: {
          $in: licenceNumbers
        }
      },
      taskConfigId,
      params,
      sender
    },
    json: true
  };
  return rp(options);
};

module.exports = {
  sendNotifyMessage,
  pendingImport,
  lookup,
  taskConfig,
  sendNotification
};
