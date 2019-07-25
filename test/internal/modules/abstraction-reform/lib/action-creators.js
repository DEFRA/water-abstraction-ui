require('dotenv').config();
const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');

const { ADD_DATA, EDIT_DATA, DELETE_DATA } = require('internal/modules/abstraction-reform/lib/action-types');
const { createAddData, createEditData, createDeleteData } = require('internal/modules/abstraction-reform/lib/action-creators');

const lab = exports.lab = Lab.script();

const defra = {
  userId: 'f6c5355b-e18d-438c-a91d-3e1814066caa',
  userName: 'mail@example.com'
};

lab.experiment('Test createAddData action creator', () => {
  const action = createAddData('wr22/2.1', defra, '100', '1');

  lab.test('It should have the correct action type', async () => {
    expect(action.type).to.equal(ADD_DATA);
  });

  lab.test('The payload should include the correct schema type', async () => {
    expect(action.payload.schema).to.equal('wr22/2.1');
  });

  lab.test('The ID should be a GUID', async () => {
    expect(action.payload.id).to.be.a.string();
    expect(action.payload.id).to.have.length(36);
  });

  lab.test('The payload should contain the user email address', async () => {
    expect(action.payload.user.email).to.equal(defra.userName);
  });

  lab.test('The payload should contain the user ID', async () => {
    expect(action.payload.user.id).to.equal(defra.userId);
  });

  lab.test('The payload should contain a timestamp', async () => {
    expect(action.payload.timestamp).to.be.a.number();
  });

  lab.test('The payload should include the licence issue number as an integer', async () => {
    expect(action.payload.issueNumber).to.equal(100);
  });

  lab.test('The payload should include the licence increment number as an integer', async () => {
    expect(action.payload.incrementNumber).to.equal(1);
  });
});

lab.experiment('Test createEditData action creator', () => {
  const data = { foo: 'bar' };
  const id = '0330f767-0a24-48bc-b51a-a5b799f87a6d';
  const action = createEditData(data, defra, id);

  lab.test('It should have the correct action type', async () => {
    expect(action.type).to.equal(EDIT_DATA);
  });

  lab.test('The payload should include the correct data', async () => {
    expect(action.payload.data).to.equal(data);
  });

  lab.test('The payload should have the correct ID', async () => {
    expect(action.payload.id).to.equal(id);
  });

  lab.test('The payload should contain the user email address', async () => {
    expect(action.payload.user.email).to.equal(defra.userName);
  });

  lab.test('The payload should contain the user ID', async () => {
    expect(action.payload.user.id).to.equal(defra.userId);
  });

  lab.test('The payload should contain a timestamp', async () => {
    expect(action.payload.timestamp).to.be.a.number();
  });
});

lab.experiment('Test createDeleteData action creator', () => {
  const id = '0330f767-0a24-48bc-b51a-a5b799f87a6d';
  const action = createDeleteData(defra, id);

  lab.test('It should have the correct action type', async () => {
    expect(action.type).to.equal(DELETE_DATA);
  });

  lab.test('It should have the correct ID', async () => {
    expect(action.payload.id).to.equal(id);
  });

  lab.test('The payload should contain the user email address', async () => {
    expect(action.payload.user.email).to.equal(defra.userName);
  });

  lab.test('The payload should contain the user ID', async () => {
    expect(action.payload.user.id).to.equal(defra.userId);
  });

  lab.test('The payload should contain a timestamp', async () => {
    expect(action.payload.timestamp).to.be.a.number();
  });
});

exports.lab = lab;
