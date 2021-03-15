'use strict';

const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ReturnCycles extends ServiceClient {
  getReport () {
    const uri = this.joinUrl('return-cycles/report');
    return this.serviceRequest.get(uri);
  }
}

module.exports = ReturnCycles;
