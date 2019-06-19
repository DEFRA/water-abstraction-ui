const apiClientFactory = require('shared/lib/connectors/api-client-factory');
const serviceRequest = require('shared/lib/connectors/service-request');

const { logger } = require('../../logger');
const { getInternalSearchResults } = require('./water-service/internal-search');

const config = require('../../config');
const waterUri = config.services.water;

function sendNotifyMessage (messageRef, recipient, personalisation) {
  const url = `${waterUri}/notify/${messageRef}`;
  const body = { recipient, personalisation };

  return serviceRequest.post(url, { body })
    .then(response => {
      const data = response.body;
      return data;
    }).catch(response => {
      logger.error('Error sending notify message', { error: response.error });
      return response;
    });
}

const pendingImport = apiClientFactory.create(`${waterUri}/pending_import`);

const lookup = apiClientFactory.create(`${waterUri}/lookup`);

const taskConfig = apiClientFactory.create(`${waterUri}/taskConfig`);

const events = apiClientFactory.create(`${waterUri}/event`);

/**
 * Send/preview notifications.  Builds de-duped contact list and renders templates
 * @param {Number} taskConfigId - the task ID in the water service task_config table
 * @param {Array} licenceNumbers - an array of licence numbers
 * @param {Object} params - user-entered template parameters
 * @param {String} sender - email address of sender.  If not supplied, reverts to preview mode
 * @return {Promise} resolves with an array of contacts, each with licence numbers and rendered templates attached
 */
const sendNotification = function (taskConfigId, licenceNumbers, params = {}, sender = null) {
  const uri = `${waterUri}/notification/${sender ? 'send' : 'preview'}`;
  const options = {
    body: {
      filter: {
        system_external_id: {
          $in: licenceNumbers
        }
      },
      taskConfigId,
      params,
      sender
    }
  };
  return serviceRequest.post(uri, options);
};

const gaugingStations = apiClientFactory.create(`${waterUri}/gaugingStations`);

/**
 * Get gauging station data
 * @param {String} gaugingStation - the gauging station ID
 * @return {Promise} resolves with gauging station data
 */
const getRiverLevel = function (gaugingStation) {
  const uri = `${waterUri}/river-levels/station/${gaugingStation}`;
  return serviceRequest.get(uri);
};

const picklists = apiClientFactory.create(`${waterUri}/picklists`);

const picklistItems = apiClientFactory.create(`${waterUri}/picklist-items`);

exports.sendNotifyMessage = sendNotifyMessage;
exports.pendingImport = pendingImport;
exports.lookup = lookup;
exports.taskConfig = taskConfig;
exports.sendNotification = sendNotification;
exports.events = events;
exports.getRiverLevel = getRiverLevel;
exports.gaugingStations = gaugingStations;
exports.picklists = picklists;
exports.picklistItems = picklistItems;
exports.getInternalSearchResults = getInternalSearchResults;
