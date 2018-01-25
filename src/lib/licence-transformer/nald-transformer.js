/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const deepMap = require('deep-map');
const BaseTransformer = require('./base-transformer');

class NALDTransformer extends BaseTransformer {
  constructor(data) {

    super();


    data = deepMap(data, (val) => {
      // Convert string null to real null
      if(typeof(val) === 'string' && val === 'null') {
        return null;
      }
      return val;
    });

    // const versionCount = data.versions.length;

    const versions = data.data.versions.map(item => {
      return {
        effectiveTo : item.EFF_END_DATE
      };
    });

    this.data = {
        licenceNumber : data.LIC_NO,
        licenceHolderName : data.LIC_HOLDERS_NAME,
        effectiveFrom : data.ORIG_EFF_DATE,
        periodStart : data.PERIOD_START,
        periodEnd : data.PERIOD_END,
        maxAnnualQuantity : data.AUTH_ANN_QTY,
        sourceOfSupply : data.ABS_POINT_LOCAL_NAME,
        maxDailyQuantity : 0,
        versionCount : data.data.versions.length,
        versions,
        currentVersion : versions[versions.length-1],
        points : data.data.points.map(item => {

          return {
            ngr1 : this.formatNGRPoint(item.point.NGR1_SHEET, item.point.NGR1_EAST, item.point.NGR1_NORTH ),
            ngr2 : this.formatNGRPoint(item.point.NGR2_SHEET, item.point.NGR2_EAST, item.point.NGR2_NORTH ),
            ngr3 : this.formatNGRPoint(item.point.NGR3_SHEET, item.point.NGR3_EAST, item.point.NGR3_NORTH ),
            ngr4 : this.formatNGRPoint(item.point.NGR4_SHEET, item.point.NGR4_EAST, item.point.NGR4_NORTH ),
            localName : item.point.LOCAL_NAME
          }
        })
    };
  }

  /**
   * Formats a NGR reference to string format
   * @param {String} sheet - the sheet string, 2 chars
   * @param {String} east - the eastings
   * @param {String} north - the northings
   * @return {String} - grid reg, eg SP 123 456
   */
  formatNGRPoint(sheet, east, north) {
    if(!sheet) {
      return null;
    }
    return `${ sheet } ${ east.substr(0, 3)} ${ east.substr(0, 3) }`;
  }

}

module.exports = NALDTransformer;
