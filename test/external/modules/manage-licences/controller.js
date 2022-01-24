'use strict';

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const services = require('external/lib/connectors/services');
const controller = require('external/modules/manage-licences/controller');
const { v4: uuid } = require('uuid');

const editableRolesResponse = [
  {
    entity_role_id: 'erid:1',
    individual_entity_id: 'user_with_returns',
    entity_nm: '1@example.com',
    role: 'user_returns',
    regime_entity_id: null,
    company_entity_id: '11',
    created_at: 'created_1',
    created_by: '111'
  },
  {
    entity_role_id: 'erid:2',
    individual_entity_id: 'user_with_returns',
    entity_nm: '1@example.com',
    role: 'user',
    regime_entity_id: null,
    company_entity_id: '11',
    created_at: 'created_2',
    created_by: '333'
  },
  {
    entity_role_id: 'erid:3',
    individual_entity_id: 'user_only',
    entity_nm: '2@example.com',
    role: 'user',
    regime_entity_id: null,
    company_entity_id: '222',
    created_at: 'created_3',
    created_by: '333'
  }
];

experiment('createAccessListViewModel', () => {
  let viewModel;

  beforeEach(async () => {
    viewModel = controller.createAccessListViewModel(editableRolesResponse);
  });

  test('there are two entries', async () => {
    expect(viewModel).have.length(2);
  });

  test('there is a result for the user without returns', async () => {
    const role = viewModel.find(er => er.colleagueEntityID === 'user_only');
    expect(role.hasReturns).to.be.false();
    expect(role.returnsEntityRoleID).to.be.undefined();
    expect(role.createdAt).to.equal('created_3');
    expect(role.name).to.equal('2@example.com');
  });

  test('there is a result for the user with returns', async () => {
    const role = viewModel.find(er => er.colleagueEntityID === 'user_with_returns');
    expect(role.hasReturns).to.be.true();
    expect(role.returnsEntityRoleID).to.equal('erid:1');
    expect(role.createdAt).to.equal('created_2');
    expect(role.name).to.equal('1@example.com');
  });
});

experiment('postChangeAccess', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(services.crm.entityRoles, 'addColleagueRole').resolves({});
    sandbox.stub(services.crm.entityRoles, 'deleteColleagueRole').resolves({});

    h = {
      redirect: sinon.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const getBaseRequest = () => {
    return {
      defra: {
        entityId: 'test-entity-id'
      },
      payload: {
        returns: true,
        colleagueEntityID: 'test-colleague-id'
      }
    };
  };
  experiment('if the user has a returns role', () => {
    test('another is not added', async () => {
      const request = getBaseRequest();
      request.payload.returns = true;
      request.payload.returnsEntityRoleID = 'test-returns-entity-id';

      await controller.postChangeAccess(request, h);

      expect(services.crm.entityRoles.addColleagueRole.called).to.be.false();
      expect(services.crm.entityRoles.deleteColleagueRole.called).to.be.false();
      expect(h.redirect.calledWith('/manage_licences/access')).to.be.true();
    });

    test('it can be deleted', async () => {
      const request = getBaseRequest();
      request.payload.returns = false;
      request.payload.returnsEntityRoleID = 'test-returns-entity-id';

      await controller.postChangeAccess(request, h);

      expect(services.crm.entityRoles.addColleagueRole.called).to.be.false();
      expect(h.redirect.calledWith('/manage_licences/access')).to.be.true();

      const [entityId, returnsEntityRoleId] = services.crm.entityRoles.deleteColleagueRole.lastCall.args;
      expect(entityId).to.equal('test-entity-id');
      expect(returnsEntityRoleId).to.equal('test-returns-entity-id');
    });
  });

  experiment('if the user does not have a returns role', () => {
    test('it cannot be deleted', async () => {
      const request = getBaseRequest();
      request.payload.returns = false;

      await controller.postChangeAccess(request, h);

      expect(services.crm.entityRoles.addColleagueRole.called).to.be.false();
      expect(services.crm.entityRoles.deleteColleagueRole.called).to.be.false();
      expect(h.redirect.calledWith('/manage_licences/access')).to.be.true();
    });

    test('it can be added', async () => {
      const request = getBaseRequest();
      request.payload.returns = true;

      await controller.postChangeAccess(request, h);

      expect(services.crm.entityRoles.deleteColleagueRole.called).to.be.false();
      expect(h.redirect.calledWith('/manage_licences/access')).to.be.true();

      const [entityId, colleagueEntityId, role] = services.crm.entityRoles.addColleagueRole.lastCall.args;
      expect(entityId).to.equal('test-entity-id');
      expect(colleagueEntityId).to.equal('test-colleague-id');
      expect(role).to.equal('user_returns');
    });
  });
});

experiment('postAddAccess', () => {
  beforeEach(async () => {
    sandbox.stub(services.idm.users, 'createUserWithoutPassword').resolves({ error: '' });
    sandbox.stub(services.idm.users, 'resetPassword').resolves({ error: '' });
    sandbox.stub(services.crm.entities, 'getOrCreateIndividual').resolves({ entity_id: 1 });
    sandbox.stub(services.crm.entityRoles, 'addColleagueRole').resolves({ error: '' });
    sandbox.stub(services.idm.users, 'findOneByEmail').resolves();
    sandbox.stub(services.idm.users, 'updateExternalId').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the payload is valid', () => {
    const request = {
      defra: { entityId: 19 },
      view: {},
      payload: {
        email: 'test@email.com',
        returns: false,
        csrf_token: uuid()
      }
    };
    const h = {
      view: sandbox.stub()
    };

    test('the user is redirected to the success page', async () => {
      await controller.postAddAccess(request, h);
      expect(h.view.lastCall.args[0]).to.equal('nunjucks/manage-licences/add-access-success');
    });
  });
  experiment('when the payload is not valid', () => {
    const request = {
      defra: { entityId: 19 },
      view: {},
      payload: {
        email: 'anInvalidEmail',
        returns: false,
        csrf_token: uuid()
      }
    };
    const h = {
      view: sandbox.stub()
    };

    test('when the email is invalid the user is redirected back to the add access page', async () => {
      await controller.postAddAccess(request, h);
      expect(h.view.lastCall.args[0]).to.equal('nunjucks/manage-licences/add-access');
    });
  });
});
