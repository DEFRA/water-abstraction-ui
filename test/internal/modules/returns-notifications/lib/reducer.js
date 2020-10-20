'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach } = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const { setInitialState } = require('internal/modules/returns-notifications/lib/actions');
const reducer = require('internal/modules/returns-notifications/lib/reducer');

const DOCUMENT_ID = uuid();

const licence = {
  'id': '00000000-0000-0000-0000-000000000001',
  'licenceNumber': '01/123/ABC',
  'isWaterUndertaker': false,
  'startDate': '2020-01-01',
  'expiredDate': null,
  'lapsedDate': null,
  'revokedDate': null,
  'historicalArea': {
    'type': 'EAAR',
    'code': 'ARNA'
  },
  'regionalChargeArea': {
    'type': 'regionalChargeArea',
    'name': 'Anglian'
  },
  'region': {
    'type': 'region',
    'id': '00000000-0000-0000-0000-000000000002',
    'name': 'Anglian',
    'code': 'A',
    'numericCode': 1,
    'displayName': 'Anglian'
  },
  'endDate': null
};

const createRole = roleName => ({
  roleName,
  'id': '00000000-0000-0000-0000-000000000003',
  'dateRange': {
    'startDate': '2020-01-01',
    'endDate': null
  },
  'company': {
    'companyAddresses': [],
    'companyContacts': [],
    'name': 'TEST WATER CO LTD',
    'id': '00000000-0000-0000-0000-000000000004'
  },
  'contact': {},
  'address': {
    'town': 'TESTINGTON',
    'county': 'TESTINGSHIRE',
    'postcode': 'TT1 1TT',
    'country': null,
    'id': '00000000-0000-0000-0000-000000000005',
    'addressLine1': 'BUTTERCUP ROAD',
    'addressLine2': 'DAISY LANE',
    'addressLine3': 'TESTINGLY',
    'addressLine4': null
  }
});

const createReturn = (startDate, endDate, status, isSummer = false) => ({
  status,
  isSummer,
  'id': 'v1:1:01/123/ABC:1234:2020-04-01:2021-03-31',
  'returnVersions': [],
  'dateRange': {
    startDate,
    endDate
  },
  'isUnderQuery': false,
  'dueDate': '2021-04-28',
  'receivedDate': null,
  'abstractionPeriod': {
    'startDay': 1,
    'startMonth': 1,
    'endDay': 31,
    'endMonth': 12
  },
  'returnRequirement': {
    'returnRequirementPurposes': [
      {
        'id': '00000000-0000-0000-0000-000000000003',
        'purposeAlias': 'Spray Irrigation - Storage',
        'purposeUse': {
          'id': '00000000-0000-0000-0000-000000000004',
          'code': '420',
          'name': 'Spray Irrigation - Storage',
          'dateUpdated': '2020-10-12T09:00:03.130Z',
          'dateCreated': '2019-08-29T12:50:59.712Z',
          'lossFactor': 'high',
          'isTwoPartTariff': true
        }
      }
    ],
    'id': '00000000-0000-0000-0000-000000000005',
    'isSummer': false,
    'externalId': '1:1234',
    'legacyId': 1234
  }
});

experiment('internal/modules/returns-notifications/lib/reducer.js', () => {
  experiment('for an unknown action', () => {
    test('the state is passed through unchanghed', async () => {
      const action = {
        type: 'unknown'
      };
      const initialState = { foo: 'bar' };
      const nextState = reducer.reducer(initialState, action);
      expect(nextState).to.equal(initialState);
    });
  });

  experiment('setInitialState action', () => {
    const refDate = '2020-10-16';
    let licences, nextState;

    experiment('for a simple example', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: DOCUMENT_ID,
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'due')
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the return is pre-selected because it is due and in the current return cycle', async () => {
        expect(nextState[DOCUMENT_ID].returns[0].isSelected).to.be.true();
      });

      test('the selected role is "licenceHolder"', async () => {
        expect(nextState[DOCUMENT_ID].selectedRole).to.equal('licenceHolder');
      });

      test('the document is selected', async () => {
        expect(nextState[DOCUMENT_ID].isSelected).to.be.true();
      });
    });

    experiment('when a return is "received"', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: DOCUMENT_ID,
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'received')
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the return is not pre-selected', async () => {
        expect(nextState[DOCUMENT_ID].returns[0].isSelected).to.be.false();
      });
    });

    experiment('when a return is in a previous return cycle', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: DOCUMENT_ID,
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2018-04-01', '2019-03-31', 'due')
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the return is not pre-selected', async () => {
        expect(nextState[DOCUMENT_ID].returns[0].isSelected).to.be.false();
      });
    });

    experiment('when a return does not match the current cycle season', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: DOCUMENT_ID,
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'due', true)
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the return is not pre-selected', async () => {
        expect(nextState[DOCUMENT_ID].returns[0].isSelected).to.be.false();
      });
    });

    experiment('when there is a licenceHolder and returnsTo role', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: DOCUMENT_ID,
              roles: [
                createRole('licenceHolder'),
                createRole('returnsTo')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'due')
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the selected role is "returnsTo"', async () => {
        expect(nextState[DOCUMENT_ID].selectedRole).to.equal('returnsTo');
      });
    });

    experiment('when there is a 2+ documents', () => {
      beforeEach(async () => {
        licences = [{
          licence,
          documents: [{
            document: {
              id: uuid(),
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'due')
            ]
          }, {
            document: {
              id: uuid(),
              roles: [
                createRole('licenceHolder')
              ]
            },
            returns: [
              createReturn('2019-04-01', '2020-03-31', 'due')
            ]
          }]
        }];

        nextState = reducer.reducer({}, setInitialState({}, licences, refDate));
      });

      test('the documents are not selected', async () => {
        const arr = Object.values(nextState).map(doc => doc.isSelected);
        expect(arr).to.only.include(false);
      });
    });
  });
});
