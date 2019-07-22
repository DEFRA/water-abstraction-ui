const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();
const sinon = require('sinon');

const plugin = require('shared/plugins/user-journey');

const getTestRequest = (path, isAuthenticated = true, method = 'get') => {
  const request = {
    headers: {
      'user-agent': 'test-user-agent'
    },
    method,
    path,
    query: {},
    yar: {
      get: sinon.stub(),
      set: sinon.stub()
    }
  };

  if (isAuthenticated) {
    request.auth = {
      isAuthenticated
    };
  }

  return request;
};

experiment('plugins/user-journey', () => {
  let method;
  let h;

  beforeEach(async () => {
    const server = {
      ext: data => (method = data.method)
    };

    h = {
      continue: 'test-continue'
    };

    plugin.register(server, {});
  });

  experiment('for requests that are not part of the journey', () => {
    test('continue is returned', async () => {
      const request = getTestRequest('/public/test');
      const response = await method(request, h);

      expect(response).to.equal('test-continue');
    });

    test('the session is not queried', async () => {
      const request = getTestRequest('/assets/test');
      await method(request, h);

      expect(request.yar.get.called).to.be.false();
    });

    test('the session is not written to', async () => {
      const request = getTestRequest('/csp');
      await method(request, h);

      expect(request.yar.set.called).to.be.false();
    });

    test('/status is ignored even when authenticated', async () => {
      const request = getTestRequest('/status');
      await method(request, h);

      expect(request.yar.set.called).to.be.false();
    });
  });

  experiment('when the user is not authenticated', () => {
    test('continue is returned', async () => {
      const request = getTestRequest('/valid/route', false);
      const response = await method(request, h);

      expect(response).to.equal('test-continue');
    });

    test('the session is not queried', async () => {
      const request = getTestRequest('/valid/route', false);
      await method(request, h);

      expect(request.yar.get.called).to.be.false();
    });

    test('the session is not written to', async () => {
      const request = getTestRequest('/valid/route', false);
      await method(request, h);

      expect(request.yar.set.called).to.be.false();
    });
  });

  experiment('when a request is trackable', () => {
    test('a new journey is started if there is not already one in session', async () => {
      const request = getTestRequest('/tracking-route');
      request.yar.get.returns();

      await method(request, h);

      const [key, journey] = request.yar.set.lastCall.args;
      expect(key).to.equal('user-journey');
      expect(journey.userAgent).to.equal('test-user-agent');
      expect(journey.requests).to.have.length(1);
      expect(journey.requests[0].method).to.equal('get');
      expect(journey.requests[0].query).to.equal({});
      expect(journey.requests[0].path).to.equal('/tracking-route');
      expect(journey.requests[0].date).to.be.a.date();
    });

    test('a new request is added to the front of an existing journey', async () => {
      const request = getTestRequest('/third');
      request.yar.get.returns({
        userAgent: 'test-user-agent',
        requests: [
          { method: 'get', path: '/second', date: new Date() },
          { method: 'get', path: '/first', date: new Date() }
        ]
      });

      await method(request, h);

      const [key, journey] = request.yar.set.lastCall.args;
      expect(key).to.equal('user-journey');
      expect(journey.userAgent).to.equal('test-user-agent');
      expect(journey.requests).to.have.length(3);
      expect(journey.requests[0].method).to.equal('get');
      expect(journey.requests[0].path).to.equal('/third');
      expect(journey.requests[1].path).to.equal('/second');
      expect(journey.requests[2].path).to.equal('/first');
      expect(journey.requests[0].date).to.be.a.date();
    });

    test('if there have been 20 requests already, a new one is added, but the oldest is dropped', async () => {
      const currentSession = {
        userAgent: 'test-user-agent',
        requests: Array(20)
          .fill(1)
          .map((x, index) => {
            return {
              method: 'get',
              path: `/test-${index + 1}`,
              date: new Date()
            };
          })
          .reverse()
      };

      const request = getTestRequest('/latest');
      request.yar.get.returns(currentSession);

      await method(request, h);

      const [, journey] = request.yar.set.lastCall.args;

      expect(journey.requests).to.have.length(20);
      expect(journey.requests[0].method).to.equal('get');
      expect(journey.requests[0].path).to.equal('/latest');
      expect(journey.requests[1].path).to.equal('/test-20');
      expect(journey.requests[18].path).to.equal('/test-3');
      expect(journey.requests[19].path).to.equal('/test-2');
    });

    test('a getUserJourney function is added to the request', async () => {
      const request = getTestRequest('/tracking-route');
      request.yar.get.returns();

      await method(request, h);

      const { userJourney } = request.getUserJourney();
      expect(userJourney.requests[0].path).to.equal('/tracking-route');
    });
  });
});
