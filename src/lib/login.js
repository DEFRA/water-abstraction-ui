/**
 * Helpers for login process
 * Login can be:
 * - with email/password
 * - automatic (e.g. if password just reset)
 *
 * Login needs to:
 * - check credentials (if required)
 * - check/create CRM individual entity
 * - set signed cookie
 */

const IDM = require('./connectors/idm');
const CRM = require('./connectors/crm');



async function _getOrCreateEntity(emailAddress) {
  

}
