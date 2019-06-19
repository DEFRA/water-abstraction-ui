const EntityRolesApiClient = require('external/lib/connectors/services/crm/EntityRolesApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('external/services/EntityRolesApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      jwt: { token: 'test-jwt-token' },
      services: { crm: 'https://example.com/crm' },
      crm: {
        regimes: {
          water: {
            entityId: 'test-water-entity-id'
          }
        }
      }
    };

    client = new EntityRolesApiClient(config, logger);

    sandbox.stub(client, 'findMany');
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'delete');
    sandbox.stub(serviceRequest, 'post');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getPrimaryCompany', () => {
    test('returns null if no company is found', async () => {
      client.findMany.resolves({ data: [] });
      const primaryCompany = await client.getPrimaryCompany('entity-id');
      expect(primaryCompany).to.be.null();
    });

    test('returns the expected company is found', async () => {
      client.findMany.resolves({
        data: [
          { entity_id: 'one' },
          { entity_id: 'two', company_entity_id: 'primary-company-entity-id' }
        ]
      });
      const primaryCompany = await client.getPrimaryCompany('entity-id');
      expect(primaryCompany).to.equal('primary-company-entity-id');
    });
  });

  experiment('.getEditableRoles', () => {
    test('makes a get request to the expected URL', async () => {
      await client.getEditableRoles('entity-id');
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/crm/entity/entity-id/colleagues?sort=entity_nm&direction=1');
    });
  });

  experiment('.deleteColleagueRole', () => {
    test('makes a delete request to the expected URL', async () => {
      await client.deleteColleagueRole('entity-id', 'entity-role-id');
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal('https://example.com/crm/entity/entity-id/colleagues/entity-role-id');
    });
  });

  experiment('.addColleagueRole', () => {
    let url;
    let options;

    beforeEach(async () => {
      await client.addColleagueRole('entity-id', 'colleage-entity-role-id');
      ([url, options] = serviceRequest.post.lastCall.args);
    });

    test('makes a post request to the expected URL', async () => {
      expect(url).to.equal('https://example.com/crm/entity/entity-id/colleagues');
    });

    test('passes the expected body content', async () => {
      expect(options.body).to.equal({
        colleagueEntityID: 'colleage-entity-role-id',
        role: 'user'
      });
    });
  });
});
