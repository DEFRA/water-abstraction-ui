'use strict';

const createRole = (overrides = {}) => ({
  'id': '00000000-0000-0000-0000-000000000003',
  'roleName': overrides.roleName || 'licenceHolder',
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

const createReturn = (overrides = {}) => ({
  'id': overrides.id || 'v1:1:01/123/ABC:1234:2020-04-01:2021-03-31',
  'returnVersions': [],
  'dateRange': {
    'startDate': '2020-04-01',
    'endDate': '2021-03-31'
  },
  'isUnderQuery': false,
  'isSummer': false,
  'dueDate': '2021-04-28',
  'receivedDate': null,
  'status': 'due',
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

exports.createRole = createRole;
exports.createReturn = createReturn;
