const Lab = require('lab');
const { expect } = require('code');

const reducer = require('../../../../src/modules/abstraction-reform/lib/reducer');
const { createEditLicence, createEditPurpose } = require('../../../../src/modules/abstraction-reform/lib/action-creators');
const licence = require('../dummy-licence.json');

const lab = exports.lab = Lab.script();

const user = {
  id: 1234,
  email: 'mail@example.com'
};

lab.experiment('Test abstraction reform reducer', () => {
  lab.test('Test editing main licence data', async () => {
    const action = createEditLicence({
      EXPIRY_DATE: '15/03/2050'
    }, user);
    const nextState = reducer({ licence }, action);
    expect(nextState.licence.EXPIRY_DATE).to.equal('15/03/2050');
  });

  lab.test('Test editing purpose', async () => {
    const action = createEditPurpose({
      HOURLY_QTY: 852,
      NOTES: 'Some new notes here'
    }, user, '1000000006');

    const nextState = reducer({ licence }, action);

    expect(nextState.licence.data.current_version.purposes[0].HOURLY_QTY).to.equal(852);
    expect(nextState.licence.data.current_version.purposes[0].NOTES).to.equal('Some new notes here');
  });
});

exports.lab = lab;
