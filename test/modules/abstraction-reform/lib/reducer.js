const Lab = require('lab');
const { expect } = require('code');

const reducer = require('../../../../src/modules/abstraction-reform/lib/reducer');
const { createEditLicence, createEditPurpose, createEditPoint } = require('../../../../src/modules/abstraction-reform/lib/action-creators');
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
    expect(nextState.status).to.equal('In progress');
  });

  lab.test('Test editing purpose', async () => {
    const action = createEditPurpose({
      HOURLY_QTY: 852,
      NOTES: 'Some new notes here'
    }, user, '1000000006');

    const nextState = reducer({ licence }, action);

    expect(nextState.licence.data.current_version.purposes[0].HOURLY_QTY).to.equal(852);
    expect(nextState.licence.data.current_version.purposes[0].NOTES).to.equal('Some new notes here');
    expect(nextState.status).to.equal('In progress');
  });

  lab.test('Test editing point', async () => {
    const action = createEditPoint({
      LOCAL_NAME: 'Duck pond'
    }, user, '1000000009');

    const nextState = reducer({ licence }, action);

    expect(nextState.licence.data.current_version.purposes[0].purposePoints[0].point_detail.LOCAL_NAME).to.equal('Duck pond');
    expect(nextState.status).to.equal('In progress');
  });
});

exports.lab = lab;
