const BaseEntitiesAPIClient = require('shared/lib/connectors/services/crm/EntitiesAPIClient');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

class EntitiesAPIClient extends BaseEntitiesAPIClient {
  /**
   * Gets or creates an individual CRM entity identified by the specified email
   * address
   * @param  {String}  emailAddress - the user's IDM email address
   * @return {Promise}              resolves with CRM entity object
   */
  async getOrCreateIndividual (emailAddress) {
    const filter = {
      entity_nm: emailAddress.toLowerCase().trim(),
      entity_type: 'individual'
    };

    // Get existing entity
    const { error, data } = await this.findMany(filter);
    throwIfError(error);

    if (data.length > 1) {
      throw new Error(`${data.length} records found looking for entity with name ${emailAddress}`);
    }

    if (data.length === 1) {
      return data[0];
    }

    // Create new entity
    const response = await this.create(filter);
    throwIfError(response.error);

    return response.data;
  };
}

module.exports = EntitiesAPIClient;
