// Requests that should not be collected
const ignore = /^\/(public|assets|csp)/;
const isTrackableRoute = request => !ignore.test(request.path);

const MAX_NUMBER_OF_PATHS = 50;
const SESSION_KEY = 'user-journey';

const getNewJourney = request => ({
  userAgent: request.headers['user-agent'],
  requests: []
});

const getJourneyFromSession = request => {
  return request.yar.get(SESSION_KEY) || getNewJourney(request);
};

const updateJourney = (request, journey) => {
  const { path, query, method } = request;
  const latestRequest = { date: new Date(), path, query, method };

  // Put the latest request at the front of the array to mimic a stack
  // trace knocking off the oldest record if there are 50 stored requests.
  journey.requests = [latestRequest, ...journey.requests.slice(0, MAX_NUMBER_OF_PATHS - 1)];

  return journey;
};

const saveJourney = (request, journey) => request.yar.set(SESSION_KEY, journey);

const onPreHandler = async (request, h) => {
  if (isTrackableRoute(request)) {
    const userJourney = getJourneyFromSession(request);
    updateJourney(request, userJourney);
    saveJourney(request, userJourney);

    request.getUserJourney = () => ({ userJourney });
  }
  return h.continue;
};

module.exports = {
  register: (server) => {
    server.ext({
      type: 'onPreHandler',
      method: onPreHandler
    });
  },
  pkg: {
    name: 'userJourney',
    version: '1.0.0'
  }
};
