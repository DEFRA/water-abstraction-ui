/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const deepMap = require('deep-map');
const {sortBy, find, uniqBy} = require('lodash');
const BaseTransformer = require('./base-transformer');
const LicenceTitleLoader = require('../licence-title-loader');
const licenceTitleLoader = new LicenceTitleLoader();
const NALDHelpers = require('./nald-helpers');

class NALDTransformer extends BaseTransformer {


  /**
   * Transform string 'null' values to real null
   * @param {Object} data
   * @return {Object}
   */
  transformNull(data) {
    return deepMap(data, (val) => {
      // Convert string null to real null
      if(typeof(val) === 'string' && val === 'null') {
        return null;
      }
      return val;
    });
  }


  /**
   * Load data into the transformer
   * @param {Object} data - data loaded from NALD
   */
  async load(data) {
    data = this.transformNull(data);

    // Versions - sorted by issue number
    const sortedVersions = sortBy(data.data.versions, (version) => {
      return parseFloat(version.ISSUE_NO);
    });
    const currentVersion = sortedVersions[sortedVersions.length-1];

    const licenceHolderParty = find(currentVersion.parties, (party) => {
      return party.ID === currentVersion.ACON_APAR_ID;
    });

    const points = this.pointsFormatter(data.data.purposes);



    // Group conditions by code, subcode > point
    const conditions = await this.conditionFormatter(data.data.purposes);


    const abstractionPeriods = this.periodsFormatter(data.data.purposes);



    this.data = {
        licenceNumber : data.LIC_NO,
        licenceHolderName : licenceHolderParty.NAME,
        effectiveDate : data.ORIG_EFF_DATE,
        expiryDate: data.EXPIRY_DATE,
        // periodStart : data.PERIOD_START,
        // periodEnd : data.PERIOD_END,
        // maxAnnualQuantity : data.AUTH_ANN_QTY,
        // sourceOfSupply : data.ABS_POINT_LOCAL_NAME,
        // maxDailyQuantity : 0,
        versionCount : data.data.versions.length,
        // versions,
        // currentVersion,
        conditions,
        points,


        abstractionPeriods,

        purposes : data.data.purposes.map(purpose => {
          return {
            annualQty : purpose.ANNUAL_QTY,
            dailyQty : purpose.DAILY_QTY
          }
        })

        // purposes : data.data.purposes.map(purpose => {
        //
        //   return {
        //     primary : {
        //       code : purpose.purpose.purpose_primary.CODE,
        //       description : purpose.purpose.purpose_primary.DESCR
        //     },
        //     secondary : {
        //       code : purpose.purpose.purpose_secondary.CODE,
        //       description : purpose.purpose.purpose_secondary.DESCR
        //     },
        //     tertiary : {
        //       code : purpose.purpose.purpose_tertiary.CODE,
        //       description : purpose.purpose.purpose_tertiary.DESCR
        //     },
        //     periodStart : purpose.PERIOD_ST_DAY + '/' + purpose.PERIOD_ST_MONTH,
        //     periodEnd : purpose.PERIOD_END_DAY + '/' + purpose.PERIOD_END_MONTH
        //   };
        //
        // })
    };

    return this.data;
  }

  /**
   * Create a unique list of abstraction periods
   * @param {Array} purposes
   * @return {Array} array of periods
   */
  periodsFormatter(purposes) {
    const periods = purposes.map((purpose) => {
      return {
        purpose : purpose.purpose.purpose_tertiary.DESCR,
        periodStart : purpose.PERIOD_ST_DAY + '/' + purpose.PERIOD_ST_MONTH,
        periodEnd : purpose.PERIOD_END_DAY + '/' + purpose.PERIOD_END_MONTH
      };
    });

    return uniqBy(periods, item => Object.values(item).join(','));
  }


  /**
   * Format purposes to provide an array of points
   * @param {Array} purposes
   * @return {Array} array of points
   */
  pointsFormatter(purposes) {
    const points = [];
    purposes.forEach((purpose) => {
      purpose.purposePoints.forEach((purposePoint) => {
        points.push(NALDHelpers.formatAbstractionPoint(purposePoint.point_detail));
      });
    });
    return points;
  }


  /**
   * Formats conditions in the NALD data into a form that can be used
   * in the licence conditions screen
   * @param {Object} purposes - purposes array from NALD data
   * @return {Array} array of condition types / points / conditions
   */
  async conditionFormatter(purposes) {

    // Read condition titles from CSV
    const titleData = await licenceTitleLoader.load();

    /**
     * Match a condition within the condition array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const conditionMatcher = (code, subCode) => {
      return (item) => (code === item.code) && (subCode === item.subCode);
    };

    /**
     * Match a point within the condition points array
     * @param {Object} point
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const pointMatcher = (points) => {
      return (item) => item.points.join(',') === points.join(',');
    }

    const conditionsArr = [];

    purposes.forEach((purpose) => {

        const points = purpose.purposePoints.map((purposePoint) => {
          return NALDHelpers.abstractionPointToString(NALDHelpers.formatAbstractionPoint(purposePoint.point_detail));
        });

        purpose.licenceConditions.forEach((condition) => {

          const {CODE : code, SUBCODE : subCode} = condition.condition_type;
          const {TEXT : text, PARAM1 : parameter1, PARAM2 : parameter2} = condition;

          // Condition wrapper
          let cWrapper = find(conditionsArr, conditionMatcher(code, subCode));
          if(!cWrapper) {
            const titles = find(titleData, conditionMatcher(code, subCode));
            cWrapper = {...titles, code, subCode, points : [],
            purpose : purpose.purpose.purpose_tertiary.DESCR};
            conditionsArr.push(cWrapper);
          }

          // Points wrapper
          let pWrapper = find(cWrapper.points, pointMatcher(points));
          if(!pWrapper) {
            pWrapper = { points, conditions : []}
            cWrapper.points.push(pWrapper);
          }

          // Add condition
          pWrapper.conditions.push({
            parameter1,
            parameter2,
            text
          });

        });

  });


    return conditionsArr;
  }



}

module.exports = NALDTransformer;
