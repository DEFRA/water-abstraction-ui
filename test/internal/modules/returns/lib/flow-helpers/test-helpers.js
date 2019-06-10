const { scope } = require('internal/lib/constants');
const returnId = 'v1:123:456';

const createRequest = (isInternal = false) => {
  return {
    auth: {
      credentials: {
        scope: [isInternal ? scope.internal : scope.external]
      }
    },
    query: {
      returnId
    }
  };
};

module.exports = {
  createRequest
};
