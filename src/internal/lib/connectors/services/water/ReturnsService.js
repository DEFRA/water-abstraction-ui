const SharedReturnsService = require('shared/lib/connectors/services/water/ReturnsService');
const { pick } = require('lodash');

class ReturnsService extends SharedReturnsService {
  /**
  * Patch return header.  This method is on the water service, but only
  * updates limited info in the return row itself - status, received date
  * (and later under query flag)
  * @param {Object} return data
  * @return {Promise} resolves when patch complete
  */
  patchReturn (data) {
    const { returnId } = data;

    const body = pick(data, ['returnId', 'status', 'receivedDate', 'user', 'isUnderQuery']);

    const url = this.joinUrl('returns/header');
    return this.serviceRequest.patch(url, {
      body,
      qs: { returnId }
    });
  }

  /**
   * Gets a returns and the licence holder/returns contacts for
   * the supplied list of licence numbers
   * @param {Array<String>} licenceNumbers
   * @return {Promise<Array>}
   */
  getIncompleteReturns (licenceNumbers) {
    const url = this.joinUrl('returns/incomplete');
    return this.serviceRequest.get(url, {
      qs: { licenceNumbers },
      qsStringifyOptions: { arrayFormat: 'repeat' }
    });
  }
}

module.exports = ReturnsService;
