const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { mapResponseToView } = require('../../../../src/modules/internal-search/lib/api-response-mapper');

experiment('mapResponseToView', () => {
  const request = {
    permissions: {
      returns: {
        edit: true
      },
      admin: {
        defra: true
      }
    }
  };

  test('noResults should be set if there are no licence, return or user results', async () => {
    const result = mapResponseToView({}, request);
    expect(result.noResults).to.equal(true);
  });

  test('Documents should be passed through unchanged if present', async () => {
    const documents = [{ documentId: 'abc' }];
    const result = mapResponseToView({ documents }, request);
    expect(result.documents).to.equal(documents);
  });

  test('Users should be passed through unchanged if present', async () => {
    const users = [{ userId: 123 }];
    const result = mapResponseToView({ users }, request);
    expect(result.users).to.equal(users);
  });

  test('Returns should be mapped and returned if present', async () => {
    const returns = [{ return_id: 'v1:8:1234' }];

    const { returns: [ret] } = mapResponseToView({ returns }, request);

    expect(ret.return_id).to.equal(returns[0].return_id);
    expect(ret.badge).to.be.an.object();
    expect(ret.path).to.be.a.string();
    expect(ret.isEdit).to.be.a.boolean();
  });
});
