class AuthTokenError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AuthTokenError';
  }
}

module.exports = {
  AuthTokenError
};
