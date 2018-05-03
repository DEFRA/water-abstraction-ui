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

module.exports = {
  sendNotifyMessage,
  pendingImport,
  lookup,
  taskConfig
};
