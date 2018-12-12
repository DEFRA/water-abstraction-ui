const Lab = require('lab');
const { expect } = require('code');

const reducer = require('../../../../src/modules/abstraction-reform/lib/reducer');
const {
  createEditLicence, createEditPurpose, createEditPoint, createEditCondition,
  createSetStatus, createEditVersion, createEditParty, createEditAddress,
  createAddData
} = require('../../../../src/modules/abstraction-reform/lib/action-creators');
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

  lab.test('Test editing condition', async () => {
    const action = createEditCondition({
      PARAM1: 'SG 987 123'
    }, user, '1000000007');

    const nextState = reducer({ licence }, action);

    expect(nextState.licence.data.current_version.purposes[0].licenceConditions[0].PARAM1).to.equal('SG 987 123');
    expect(nextState.status).to.equal('In progress');
  });

  lab.test('Test setting status', async () => {
    const action = createSetStatus('In review', 'My notes', {
      username: 'mail@example.com',
      user_id: 123
    });

    const nextState = reducer({ licence, notes: [] }, action);

    expect(nextState.status).to.equal('In review');
    expect(nextState.notes[0].notes).to.equal('My notes');
    expect(nextState.notes[0].user.email).to.equal('mail@example.com');
    expect(nextState.notes[0].user.id).to.equal(123);
  });
});

lab.experiment('Test reducer with createEditVersion', () => {
  const getNextState = (issue = 100, increment = 0) => {
    const action = createEditVersion({
      STATUS: 'SUPER',
      LIC_SIG_DATE: '01/11/2018'
    }, user, issue, increment);

    return reducer({ licence }, action);
  };

  lab.test('It should edit current licence version if issue/increment matches', async () => {
    const nextState = getNextState();

    const { licence: version } = nextState.licence.data.current_version;

    expect(version.STATUS).to.equal('SUPER');
    expect(version.LIC_SIG_DATE).to.equal('01/11/2018');

    // The version in the versions array should also be edited
    const { versions } = nextState.licence.data;

    expect(versions[0].STATUS).to.equal('SUPER');
    expect(versions[0].LIC_SIG_DATE).to.equal('01/11/2018');
  });

  lab.test('It should not edit current licence version if issue/increment does not match', async () => {
    const { licence: nextStateLicence } = getNextState(100, 1);
    expect(nextStateLicence).to.equal(licence);
  });
});

lab.experiment('Test reducer with createEditParty', () => {
  const getNextState = (id = '1000000003') => {
    const action = createEditParty({
      FORENAME: 'FRED',
      NAME: 'BLOGGS'
    }, user, id);

    return reducer({ licence }, action);
  };

  lab.test('It should edit a party if ID matches', async () => {
    const nextState = getNextState();

    // Current licence version party
    {
      const party = nextState.licence.data.current_version.licence.party[0];
      expect(party.FORENAME).to.equal('FRED');
      expect(party.NAME).to.equal('BLOGGS');
    }

    // The party directly in the current version should be edited
    {
      const party = nextState.licence.data.current_version.party;
      expect(party.FORENAME).to.equal('FRED');
      expect(party.NAME).to.equal('BLOGGS');
    }
    // The party in the versions array should also be edited
    {
      const party = nextState.licence.data.versions[0].parties[0];
      expect(party.FORENAME).to.equal('FRED');
      expect(party.NAME).to.equal('BLOGGS');
    }
  });

  lab.test('It should not edit a party if IDs to not match', async () => {
    const { licence: nextStateLicence } = getNextState('ABCD');
    expect(nextStateLicence).to.equal(licence);
  });
});

lab.experiment('Test reducer with createEditAddress', () => {
  const getNextState = (id = '1000000004') => {
    const action = createEditAddress({
      ADDR_LINE_1: 'BUTTERCUP FARM',
      POSTCODE: 'BT1 FR1'
    }, user, id);

    return reducer({ licence }, action);
  };

  lab.test('It should edit address if ID matches', async () => {
    const nextState = getNextState();

    // The current version address should be edited
    {
      const { address } = nextState.licence.data.current_version;

      expect(address.ADDR_LINE_1).to.equal('BUTTERCUP FARM');
      expect(address.POSTCODE).to.equal('BT1 FR1');
    }
    {
    // The address in the versions array should also be edited
      const { party_address: address } = nextState.licence.data.versions[0].parties[0].contacts[0];
      expect(address.ADDR_LINE_1).to.equal('BUTTERCUP FARM');
      expect(address.POSTCODE).to.equal('BT1 FR1');
    }
  });

  lab.test('It should not edit address if ID does not match', async () => {
    const { licence: nextStateLicence } = getNextState('XYZ');
    expect(nextStateLicence).to.equal(licence);
  });
});

lab.experiment('Test abstraction reform reducer - add WR22 data', () => {
  const schema = 'wr22/2.1';
  const issueNumber = '100';
  const incrementNumber = '1';
  const state = { licence };
  const action = createAddData(schema, user, issueNumber, incrementNumber);

  const expected = {
    schema: 'wr22/2.1',
    issueNumber: 100,
    incrementNumber: 1,
    content: {}
  };

  lab.test('It should add not affect base licence data when adding AR schema data', async () => {
    const nextState = reducer(state, action);
    expect(nextState.licence.data).to.equal(state.licence.data);
  });

  lab.test('It should add AR data when there is no existing AR data', async () => {
    const nextState = reducer(state, action);
    expect(nextState.licence.arData).to.equal([{
      id: action.payload.id,
      ...expected
    }]);
  });

  lab.test('It should not add AR data when ID already exists', async () => {
    const func = () => {
      let nextState = reducer(state, action);
      nextState = reducer(nextState, action);
    };
    expect(func).to.throw();
  });

  lab.test('It should add AR data when there is existing AR data', async () => {
    const action2 = createAddData(schema, user, issueNumber, incrementNumber);
    let nextState = reducer(state, action);
    nextState = reducer(nextState, action2);
    const ids = nextState.licence.arData.map(item => item.id);
    expect(ids).to.equal([action.payload.id, action2.payload.id]);
  });
});

exports.lab = lab;
