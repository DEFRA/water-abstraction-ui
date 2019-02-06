const serviceRequest = require('../service-request');

const getCommunication = communicationId => {
  const url = `${process.env.WATER_URI}/communications/${communicationId}`;
  return serviceRequest.get(url);
};

module.exports = {
  getCommunication
};
