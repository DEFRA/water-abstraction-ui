const SESSION_KEY = 'addressLookupData';

const getNewAddress = function (clearData = true) {
  const address = this.yar.get(SESSION_KEY);
  if (clearData) this.yar.clear(SESSION_KEY);
  return address || {};
};

const setNewAddress = function (address) {
  return this.yar.set(SESSION_KEY, address);
};

const addressLookupPlugin = {
  register: (server) => {
    server.decorate('request', 'getNewAddress', getNewAddress);
    server.decorate('request', 'setNewAddress', setNewAddress);
  },

  pkg: {
    name: 'addressLookupPlugin',
    version: '1.0.0'
  }
};

module.exports = addressLookupPlugin;
