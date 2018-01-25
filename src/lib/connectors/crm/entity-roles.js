/**
 * Creates a client connector for the CRM entity roles API endpoint
 * @module lib/connectors/crm/entity-roles
 */
const { APIClient } = require('hapi-pg-rest-api');
const moment = require('moment');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false,
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${ process.env.CRM_URI }/entity/{entityId}/roles`,
  headers: {
    Authorization: process.env.JWT_TOKEN,
  },
})



client.getEditableRoles = async function(entity_id,sort,direction) {
  ///entity/{entity_id}/colleagues
  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues?sort='+sort+'&direction='+direction+'&token=' + process.env.JWT_TOKEN
  console.log(uri)
  const options = {
        method: `GET`,
        uri: uri
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        Promise.reject(error);
      }
}

client.deleteColleagueRole = async function (entity_id,entity_role_id) {
  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues/'+entity_role_id+'?token=' + process.env.JWT_TOKEN
  const options = {
        method: `DELETE`,
        uri: uri
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        Promise.reject(error);
      }
}

client.addColleagueRole = async function(entity_id,email) {

  const uri=process.env.CRM_URI + '/entity/' + entity_id + '/colleagues/?token=' + process.env.JWT_TOKEN
  var data={email:email}
  const options = {
        method: `POST`,
        uri: uri,
        json : true,
        body : data
      };
      try {
        const response = await rp(options);
        return Promise.resolve(response);
      }
      catch (error) {
        console.log(error)
        return Promise.reject(error);
      }
}


module.exports = client;
