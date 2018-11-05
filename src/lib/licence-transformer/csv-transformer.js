/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const deepMap = require('deep-map');
const {sortBy, find, uniqBy, filter} = require('lodash');
const BaseTransformer = require('./base-transformer');
const LicenceTitleLoader = require('../licence-title-loader');
const licenceTitleLoader = new LicenceTitleLoader();
const NALDHelpers = require('./nald-helpers');
const sentenceCase = require('sentence-case');


/**
 * Finds the relevant title and parameter titles from the supplied
 * CSV data, and returns that row object
 * Also converts all titles to sentence case
 * @param {Array} data - loaded from titles CSV doc
 * @param {String} code - the licence condition code
 * @param {String} subCode - the licence condition sub-code
 * @return {Object|null} object corresponding to licence row (if found)
 */
function _findTitle(data, code, subCode) {
   return find(data, (item) => {
      return (item.code === code) && (item.subCode === subCode);
   });
}

/**
 * Formats an abstraction point into a string
 * Example:  name, ngr1, ngr2
 * @param {Object} point - abstraction point from licence data
 * @return {String} abstraction point info formatted as String
 */
function _formatAbstractionPoint(point) {
  const {name, ngr1, ngr2, ngr3, ngr4} = point;
  const parts = [name, ngr1, ngr2, ngr3, ngr4].filter(x => x);
  return parts.join(', ');
}


/**
 * Convert points array to string of sorted IDs
 * @param {Array} points
 * @return {String}
 */
function _pointsToStr(points) {
  return sortBy(points.map(_formatAbstractionPoint)).join('; ');
}

/**
 * Compare 2 sets of points, returning true if identical IDs
 * @param {Array} points1
 * @param {Array} points2
 * @return {Boolean}
 */
function _comparePoints(points1, points2) {
  return pointsToStr(points1) === pointsToStr(points2);
}

/**
 * Convert condition to string
 * @param {Object} condition
 * @return {String}
 */
function _conditionToStr(condition) {
  const {code, subCode, parameter1, parameter2, description, purpose} = condition;
  return [code, subCode, parameter1, parameter2, description, purpose.id].join(',');
}

/**
 * Compare conditions
 * @param {Object} cond1 - first condition
 * @param {Object} cond2 - second condition
 * @return {Boolean} true if the same
 */
function _compareConditions(cond1, cond2) {
  return _conditionToStr(cond1) === _conditionToStr(cond2);
}

/**
 * Creates a unique ID for a condition/point combination
 * @param {Object} condition
 * @param {Array} points
 * @return {String} unique ID
 */
function _createId(condition, purpose) {
  const {points} = purpose;
  return condition.code + '-' + condition.subCode + '-' + sortBy(points.map(point => point.id)).join(',');
}

/**
 * Find unique condition/points within conditions list
 * @param {Array} data - existing list of categorised conditions
 * @param {Object} condition - the condition to find
 * @param {Object} purpose - the purpose
 * @return {Object} container for grouped conditions
 */
async function _findCondition(data, condition, purpose) {

  // Read condition titles from CSV
  const titleData = await licenceTitleLoader.load();

  const {points} = purpose;
  const id = _createId(condition, purpose);
  const item = find(data, item => item.id === id);

  // Existing item found - return it
  if(item) {
    return item;
  }

  // Create new item
  // Lookup title in CSV data
  const titles = _findTitle(titleData, condition.code, condition.subCode);

  const newItem = {
      id,
      code : condition.code,
      subCode : condition.subCode,
      points : points.map(_formatAbstractionPoint),
      conditions : [],
      titles
  };

  data.push(newItem);

  return newItem;
}


/**
 * Find unique condition/points within conditions list
 * @param {Array} data - existing list of categorised conditions
 * @param {Object} condition - the condition to find
 * @param {Object} purpose - the purpose
 * @return {Object} container for grouped conditions
 */
async function _findCondition(data, condition, purpose) {

  // Read condition titles from CSV
  const titleData = await licenceTitleLoader.load();

  const {points} = purpose;
  const id = _createId(condition, purpose);
  const item = find(data, item => item.id === id);

  // Existing item found - return it
  if(item) {
    return item;
  }

  // Create new item
  // Lookup title in CSV data
  const titles = _findTitle(titleData, condition.code, condition.subCode);

  const newItem = {
      id,
      code : condition.code,
      subCode : condition.subCode,
      points : points.map(_formatAbstractionPoint),
      conditions : [],
      titles
  };

  data.push(newItem);

  return newItem;
}



class CSVTransformer extends BaseTransformer {


  /**
   * Transform string 'null' values to real null
   * @param {Object} data
   * @return {Object}
   */
  transformNull(data) {
    return deepMap(data, (val) => {
      // Convert string null to real null
      if(typeof(val) === 'string' && (val === 'null' || val === '')) {
        return null;
      }
      return val;
    });
  }


  /**
   * Load data into the transformer
   * @param {Object} data - data loaded from NALD
   */
  async load (data) {
    data = this.transformNull(data);

    this.data = {
      licenceNumber: data.id,
      licenceHolderTitle: data.salutation,
      licenceHolderInitials: data.initials,
      licenceHolderName: data.name,
      effectiveDate: data.effectiveFrom,
      expiryDate: data.effectiveTo === 'No expiry' ? null : data.effectiveTo,
      conditions: await this.conditionFormatter(data.purposes),
      points: this.pointsFormatter(data.purposes),
      purposes: this.purposesFormatter(data.purposes),
      uniquePurposeNames: this.uniquePurposeNamesFormatter(data.purposes),
      abstractionPeriods: this.periodsFormatter(data.purposes),
      contacts: this.contactsFormatter(data)
    };
  }

  /**
   * Get list of contacts
   * @param {Object} data - CSV licence data object
   * @return {Array} contacts
   */
  contactsFormatter(data) {
    const {salutation, initials, forename, name} = data;
    const {addressLine1, addressLine2, addressLine3, addressLine4, town, county, postCode, country} = data;

    return [{
      type : 'Licence Holder',
      contactType : data.salutation ? 'Person' : 'Organisation',
      name : [salutation, initials, forename, name].filter(x => x).join(' '),
      addressLine1,
      addressLine2,
      addressLine3,
      addressLine4,
      town,
      county,
      postcode : postCode,
      country
    }];
  }


  /**
   * Get unique list of abstraction periods
   * @param {Array} purposes
   * @return {Array}
   */
  periodsFormatter(purposes) {
    const periods = purposes.map(item => ({
      periodStart : item.periodStart,
      periodEnd : item.periodEnd
    }));
    return uniqBy(periods, item => Object.values(item).join(','));
  }


  /**
   * Get unique array of purpose names
   * @param {Array} purposes
   * @return {Array} of string names
   */
  uniquePurposeNamesFormatter(purposes) {
    const purposeNames = purposes.map(item => item.description);
    return uniqBy(purposeNames);
  }


  /**
   * Format purposes into unique array with quantities and points data
   * @param {Array} purposes
   * @return {Array} formatted purposes
   */
  purposesFormatter(purposes) {
    const formatted = purposes.map(purpose => ({
        name : purpose.description,
        points : purpose.points,
        periodStart : purpose.periodStart,
        periodEnd : purpose.periodEnd,
        annualQty : purpose.annualQuantity,
        dailyQty : purpose.dailyQuantity,
        hourlyQty : purpose.hourlyQuantity,
        instantaneousQty: purpose.instantQuantity
    }));

    // De-duplicate
    return uniqBy(formatted, item => Object.values(item).join(','));
  }

  /**
   * Get unique list of purpose names
   * @param {}
  uniquePurposeNames



  /**
   * Formats points within purposes to a unique list
   * @param {Array} purposes
   * @return {Array}
   */
  pointsFormatter(purposes) {

    let points = [];

    purposes.forEach(purpose => {
      points = [...points, ...purpose.points];
    });

    // De-duplicate
    return uniqBy(points, item => Object.values(item).join(','));
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
     * @param {String} purpose - the tertiary purpose description
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const conditionMatcher = (code, subCode, purpose) => {
      return (item) => (code === item.code) && (subCode === item.subCode) && (purpose === item.purpose);
    };

    /**
     * Match a title within the display titles array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @return {Function} returns a predicate that can be used in lodash/find
     */
    const titleMatcher = (code, subCode) => {
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

        const points = purpose.points.map(_formatAbstractionPoint);

        purpose.conditions.forEach((condition) => {

          const {code, subCode, parameter1, parameter2, text} = condition;
          const {description : purposeText } = purpose;

          if(!code) {
            return;
          }

          // Condition wrapper
          let cWrapper = find(conditionsArr, conditionMatcher(code, subCode, purposeText));
          if(!cWrapper) {
            const titles = find(titleData, titleMatcher(code, subCode));
            cWrapper = {...titles, code, subCode, points : [], purpose : purposeText};
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

          // De-dedupe
          // @TODO - remove duplication in original data
          pWrapper.conditions = uniqBy(pWrapper.conditions, item => Object.values(item).join(','));

        });

  });


    return conditionsArr;
  }




}

module.exports = CSVTransformer;
