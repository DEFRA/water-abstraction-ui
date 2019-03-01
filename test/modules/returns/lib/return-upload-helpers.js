'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const helpers = require('../../../../src/modules/returns/lib/return-upload-helpers');

const eventId = 'event_1';
const userName = 'user_1';
const companyId = 'company_1';
const entityId = 'entity_1';

const createRequest = () => {
  return {
    params: {
      eventId
    },
    auth: {
      credentials: {
        entity_id: entityId,
        username: userName,
        companyId
      }
    }
  };
};

const lines = [{
  startDate: '2018-12-01',
  quantity: 1
}, {
  startDate: '2018-12-31',
  quantity: 2
}, {
  startDate: '2019-01-01',
  quantity: 3
}];

const returns = [{
  returnId: 'v1:1:01/123:1234:2017-11-01:2018-10-31',
  frequency: 'day',
  lines,
  errors: ['Oh no']
}, {
  returnId: 'v1:1:02/345:6789:2017-11-01:2018-10-31',
  frequency: 'month',
  lines,
  errors: []
}];

experiment('return upload helpers', () => {
  experiment('mapRequestOptions', () => {
    test('should map request data for water API call', async () => {
      const request = createRequest();
      const result = helpers.mapRequestOptions(request);
      expect(result).to.equal({
        userName,
        companyId,
        entityId
      });
    });
  });

  experiment('mapReturn', () => {
    test('should return an object', async () => {
      const result = helpers.mapReturn(returns[0], eventId);
      expect(result).to.be.an.object();
    });
    test('should use return requirement in return if available', async () => {
      const ret = {
        ...returns[0],
        returnRequirement: 'foo'
      };
      const result = helpers.mapReturn(ret, eventId);
      expect(result.returnRequirement).to.equal('foo');
    });
    test('should get return requirement from returnId if not set', async () => {
      const result = helpers.mapReturn(returns[0], eventId);
      expect(result.returnRequirement).to.equal('1234');
    });

    test('for a return with errors, the path should be null', async () => {
      const result = helpers.mapReturn(returns[0], eventId);
      expect(result.path).to.equal(null);
    });
    test('for a return with no errors, the path should be set correctly', async () => {
      const result = helpers.mapReturn(returns[1], eventId);
      const url = `/returns/upload-summary/${eventId}/${returns[1].returnId}`;
      expect(result.path).to.equal(url);
    });
  });

  experiment('groupReturns', () => {
    test('groups returns depending on whether they have errors', async () => {
      const result = helpers.groupReturns(returns);
      const mapIDs = ret => ret.returnId;
      expect(result.returnsWithErrors.map(mapIDs)).to.equal([returns[0].returnId]);
      expect(result.returnsWithoutErrors.map(mapIDs)).to.equal([returns[1].returnId]);
    });

    test('runs each return through the mapper', async () => {
      const result = helpers.groupReturns(returns);
      const keys = Object.keys(result.returnsWithErrors[0]);
      expect(keys).to.include(['returnRequirement', 'path']);
    });
  });

  experiment('groupLines', () => {
    test('groups lines by their month for daily returns', async () => {
      const daily = returns[0];
      const result = helpers.groupLines(daily);
      expect(result[0].title).to.equal('December 2018');
      expect(result[0].lines).to.equal([daily.lines[0], daily.lines[1]]);
      expect(result[1].title).to.equal('January 2019');
      expect(result[1].lines).to.equal([daily.lines[2]]);
    });

    test('places all lines in a single group for non-daily returns', async () => {
      const monthly = returns[1];
      const result = helpers.groupLines(monthly);
      expect(result).to.equal([{ lines: monthly.lines }]);
    });
  });
});
