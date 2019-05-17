class LicenceNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceNotFoundError';
  }
}

class LicenceMissingError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceMissingError';
  }
}

class LicenceSimilarityError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceSimilarityError';
  }
}

class InvalidAddressError extends Error {
  constructor (message) {
    super(message);
    this.name = 'InvalidAddressError';
  }
}

class NoLicencesSelectedError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NoLicencesSelectedError';
  }
}

class LicenceFlowError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceFlowError';
  }
}

module.exports = {
  LicenceNotFoundError,
  LicenceMissingError,
  LicenceSimilarityError,
  InvalidAddressError,
  NoLicencesSelectedError,
  LicenceFlowError
};
