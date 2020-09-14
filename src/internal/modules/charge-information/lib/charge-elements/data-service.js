'use-strict';

const sessionHelpers = require('shared/lib/session-helpers');

const set = {
  source: 'unsupported',
  loss: 'high',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  },
  authorisedAnnualQuantity: 831,
  billableAnnualQuantity: null,
  purposeUse: {
    id: 'a77fedf2-c9ec-4d9d-b34b-f604fcd5bad5',
    code: '400',
    name: 'Spray Irrigation - Direct',
    dateUpdated: '2020-09-09T09:00:04.805Z',
    dateCreated: '2020-02-10T07:12:27.347Z',
    lossFactor: 'high',
    isTwoPartTariff: true
  },
  description: 'Spray Irrigation - Direct',
  season: 'summer',
  eiucSource: 'other',
  maxAnnualQuantity: 831
};

// {
//   "source": "unsupported",
//   "loss": "medium",
//   "abstractionPeriod": {
//       "startDay": 1,
//       "startMonth": 1,
//       "endDay": 31,
//       "endMonth": 12
//   },
//   "authorisedAnnualQuantity": 159944,
//   "billableAnnualQuantity": null,
//   "purposeUse": {
//       "id": "053667fa-da55-41ba-bffb-09aae119100c",
//       "code": "350",
//       "name": "Process Water",
//       "dateUpdated": "2020-09-09T09:00:04.805Z",
//       "dateCreated": "2020-02-10T07:12:27.347Z",
//       "lossFactor": "medium",
//       "isTwoPartTariff": false
//   },
//   "description": "Process Water",
//   "season": "all year",
//   "timeLimitedPeriod": {
//       "startDate": "2007-11-20",
//       "endDate": "2016-03-31"
//   },
//   "eiucSource": "other",
//   "maxAnnualQuantity": 159944
// }

// session data is stored at charge-elements-licence-ref
const sessionManager = (request, licenceId, elementId, data) => {
  const sessionKey = `chargeElement.${licenceId}.${elementId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

exports.sessionManager = sessionManager;
