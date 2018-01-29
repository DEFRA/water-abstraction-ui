/**
 * Licence transformer
 * To support abstraction reform, the format of data may change in future
 * This layer can transform licence data to different formats
 * @module lib/licence-transformer/index
 */
const NALDTransformer = require('./nald-transformer');
const FORMAT_NALD = 'NALD';

class UnsupportedLicenceFormatError extends Error {

};

class LicenceTransformer {

  /**
   * Constructor
   * @param {Object} data - licence data
   */
  async load(data) {
    const format = this.guessFormat(data);

    switch (format) {
      case FORMAT_NALD:
        this.transformer = new NALDTransformer();
        break;

      default:
        throw new UnsupportedLicenceFormatError();
    }

    await this.transformer.load(data);
  }

  /**
   * Export data
   * @return {Object}
   */
  export() {
    return this.transformer.export();
  }


  /**
   * Guess the data format from the supplied data
   * @param {Object}
   * @return {String} data format
   */
  guessFormat(data) {
    if('vmlVersion' in data && data.vmlVersion === 2) {
      return FORMAT_NALD;
    }
  }


}


module.exports = LicenceTransformer;
