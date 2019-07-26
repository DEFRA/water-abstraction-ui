const services = require('../../lib/connectors/services');
const Boom = require('@hapi/boom');

/**
 * Returns the last email message for a given email address.
 *
 * If no email for the requested address then then returns a 404.
 *
 * This function is here to facilitate acceptance tests and it
 * not currently used by the main applications. It's route is accessible
 * annonymously.
 *
 * @param {String} request.query.email - The email address to filter by,
 */
async function findLastEmail (request, reply) {
  const { email } = request.query;
  const data = await services.water.notifications.getLatestEmailByAddress(email);

  if (data.data.length === 0) {
    throw Boom.notFound(`No email found for ${email}`);
  }

  return reply.response(data);
};

exports.findLastEmail = findLastEmail;
