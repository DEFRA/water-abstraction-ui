const { invoke } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

const create = config => {
  const logger = helpers.logger.createLogger(config.logger);

  logger.errorWithJourney = (msg, error, request, params = {}) => {
    const userJourney = invoke(request, 'getUserJourney');
    const paramsToLog = Object.assign(params, userJourney);
    logger.error(msg, error, paramsToLog);
  };

  return logger;
};

exports.create = create;
