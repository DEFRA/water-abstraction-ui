const { scope } = require('../../../../../../src/external/lib/constants');
const returnId = 'v1:123:456';

const createRequest = () => {
  return {
    auth: {
      credentials: {
        scope: [scope.external]
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
