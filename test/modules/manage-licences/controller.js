'use strict';

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const controller = require('../../../src/modules/manage-licences/controller');

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
  { entity_role_id: 'erid:2',
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

lab.experiment('createAccessListViewModel', () => {
  let viewModel;

  lab.beforeEach(async () => {
    viewModel = controller.createAccessListViewModel(editableRolesResponse);
  });

  lab.test('there are two entries', async () => {
    expect(viewModel).have.length(2);
  });

  lab.test('there is a result for the user without returns', async () => {
    const role = viewModel.find(er => er.colleagueEntityID === 'user_only');
    expect(role.hasReturns).to.be.false();
    expect(role.createdAt).to.equal('created_3');
    expect(role.name).to.equal('2@example.com');
  });

  lab.test('there is a result for the user with returns', async () => {
    const role = viewModel.find(er => er.colleagueEntityID === 'user_with_returns');
    expect(role.hasReturns).to.be.true();
    expect(role.createdAt).to.equal('created_2');
    expect(role.name).to.equal('1@example.com');
  });
});
