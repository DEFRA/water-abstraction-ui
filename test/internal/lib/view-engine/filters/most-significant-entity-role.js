const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { mostSignificantEntityRole } = require('internal/lib/view-engine/filters/most-significant-entity-role');

experiment('mostSignificantEntityRole', () => {
  test('returns undefined for an undefined array of roles', async () => {
    expect(mostSignificantEntityRole()).to.be.undefined();
  });

  test('returns agent for a user role', async () => {
    const entityRoles = ['user'];
    expect(mostSignificantEntityRole(entityRoles)).to.equal('Agent');
  });

  test('returns Primary user for a primary_user role', async () => {
    const entityRoles = ['primary_user'];
    expect(mostSignificantEntityRole(entityRoles)).to.equal('Primary user');
  });

  test('returns Primary user for a primary_user role with other roles', async () => {
    const entityRoles = ['primary_user', 'user', 'user_returns'];
    expect(mostSignificantEntityRole(entityRoles)).to.equal('Primary user');
  });

  test('returns Returns user for a user_returns role', async () => {
    const entityRoles = ['user_returns'];
    expect(mostSignificantEntityRole(entityRoles)).to.equal('Returns user');
  });

  test('returns Returns user for a user_returns role with a user role', async () => {
    const entityRoles = ['user', 'user_returns'];
    expect(mostSignificantEntityRole(entityRoles)).to.equal('Returns user');
  });
});
