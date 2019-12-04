const { invoke, pick } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

const create = config => {
  const logger = helpers.logger.createLogger(config.logger);

  logger.errorWithJourney = (msg, error, request, params = {}) => {
    const userJourney = invoke(request, 'getUserJourney');
    const requestDetails = pick(request, ['method', 'params', 'query', 'payload', 'url']);
    const paramsToLog = Object.assign(params, userJourney, { requestDetails });

    logger.error('Request details for error', JSON.stringify(requestDetails));
    logger.error(msg, error, paramsToLog);
  };

  return logger;
};

exports.create = create;
