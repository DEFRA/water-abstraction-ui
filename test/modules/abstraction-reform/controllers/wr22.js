require('dotenv').config();
const Lab = require('lab');
const sinon = require('sinon');
const { expect } = require('code');
const { getDeleteData, postDeleteData } = require('../../../../src/modules/abstraction-reform/controllers/wr22');
const wr22Helpers = require('../../../../src/modules/abstraction-reform/lib/wr22-helpers');

const { experiment, beforeEach, test, afterEach } = exports.lab = Lab.script();

const id = 'bfecf668-b4ec-4046-85f5-d787d1b1d973';
const csrfToken = '4a0b2424-6c02-45a5-9935-70a4c41538d2';

const request = {
  auth: {
    credentials: {
      user_id: 123,
      username: 'mail@example.com'
    }
  },
  view: {
    csrfToken
  },
  params: {
    documentId: '76288bd8-5d26-4b49-b7cc-b4ba8d3fb3c4',
    id
  },
  payload: {
    csrf_token: csrfToken
  },
  finalState: {
    licence: {
      arData: [{
        id,
        schema: '/wr22/2.1',
        content: {
          foo: 'bar'
        }
      }]
    }
  },
  licence: {
    foo: 'bar'
  },
  arLicence: {
    bar: 'foo'
  }
};

experiment('getDeleteData', () => {
  let stub;
  const h = { view: x => x };
  let view;

  beforeEach(async () => {
    stub = sinon.stub(h, 'view').returns();
    await getDeleteData(request, h);
    view = h.view.firstCall.args[1];
  });

  afterEach(async () => {
    stub.restore();
  });

  test('The handler should output a schema object to the view', async () => {
    expect(view.schema).to.be.an.object();
  });

  test('The handler should output a form object to the view', async () => {
    expect(view.form).to.be.an.object();
  });

  test('The handler should output the AR data item to the view', async () => {
    const { arData: [arData] } = request.finalState.licence;

    expect(view.data).to.be.an.object();
    expect(view.data.id).to.equal(id);
    expect(view.data.schema).to.equal(arData.schema);
    expect(view.data.title).to.equal(`2.1 Hands off flows/levels`);
    expect(view.data.data).to.equal(arData.content);
  });
});

experiment('postDeleteData', () => {
  let redirectStub, persistStub;
  const h = { redirect: x => x };

  beforeEach(async () => {
    redirectStub = sinon.stub(h, 'redirect').returns();
    persistStub = sinon.stub(wr22Helpers, 'persistActions').resolves();
    await postDeleteData(request, h);
  });

  afterEach(async () => {
    redirectStub.restore();
    persistStub.restore();
  });

  test('The handler should call persistActions', async () => {
    const [licence, arLicence, actions] = persistStub.firstCall.args;
    expect(licence).to.equal(request.licence);
    expect(arLicence).to.equal(request.arLicence);
    expect(actions[0].type).to.equal('delete.data');
  });

  test('The handler should redirect', async () => {
    expect(redirectStub.callCount).to.equal(1);
  });
});
