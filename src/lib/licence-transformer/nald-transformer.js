/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const deepMap = require('deep-map');
const sortBy = require('lodash/sortBy');
const find = require('lodash/find');
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
   */
  async load(data) {
    data = this.transformNull(data);

    // Versions - sorted by issue number
    const sortedVersions = sortBy(data.data.versions, (version) => {
      return parseFloat(version.ISSUE_NO);
    });

    const versions = sortedVersions.map(item => {
      return {
        effectiveTo : item.EFF_END_DATE
      };
    });

    // Group conditions by code, subcode > point
    const conditions = await this.conditionFormatter(data.data.points);

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
        points : data.data.points.map(item =>
          NALDHelpers.formatAbstractionPoint(item.point)
        ),
        purposes : data.data.purpose.map(purpose => {
          return {
            primary : {
              code : purpose.purpose_primary.CODE,
              description : purpose.purpose_primary.DESCR
            },
            secondary : {
              code : purpose.purpose_secondary.CODE,
              description : purpose.purpose_secondary.DESCR
            },
            tertiary : {
              code : purpose.purpose_tertiary.CODE,
              description : purpose.purpose_tertiary.DESCR
            },
          }
        }),
        conditions
    };

    return this.data;
  }


  /**
   * Formats conditions in the NALD data into a form that can be used
   * in the licence conditions screen
   * @param {Object} points
   * @return {Array} array of condition types / points / conditions
   */
  async conditionFormatter(points) {

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
    const pointMatcher = (point) => {
      return (item) => Object.values(point).join(',') === Object.values(item.point).join(',');
    }

    const conditionsArr = [];

    points.forEach(item => {

      item.abstraction_methods.forEach((method) => {
        method.licenceConditions.forEach((condition) => {

          const {CODE : code, SUBCODE : subCode} = condition.condition_type;
          const {TEXT : text, PARAM1 : parameter1, PARAM2 : parameter2} = condition;

          // Condition wrapper
          let cWrapper = find(conditionsArr, conditionMatcher(code, subCode));
          if(!cWrapper) {
            const titles = find(titleData, conditionMatcher(code, subCode));
            cWrapper = {...titles, code, subCode, points : []};
            conditionsArr.push(cWrapper);
          }

          // Points wrapper
          let point = NALDHelpers.abstractionPointToString(NALDHelpers.formatAbstractionPoint(item.point));
          let pWrapper = find(cWrapper.points, pointMatcher(point));
          if(!pWrapper) {
            pWrapper = { point, conditions : []}
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
    });
    return conditionsArr;
  }



}

module.exports = NALDTransformer;
