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

    this.data = {
        licenceNumber : data.LIC_NO,
        licenceHolderTitle: '',
        licenceHolderInitials : '',
        licenceHolderName : licenceHolderParty.NAME,
        effectiveDate : data.ORIG_EFF_DATE,
        expiryDate: data.EXPIRY_DATE,
        versionCount : data.data.versions.length,
        conditions : await this.conditionFormatter(data.data.purposes),
        points : this.pointsFormatter(data.data.purposes),
        abstractionPeriods : this.periodsFormatter(data.data.purposes),
        aggregateQuantity : this.aggregateQuantitiesFormatter(data.data.purposes),
        contacts : this.contactsFormatter(currentVersion, data.data.roles),
        purposes : this.purposesFormatter(data.data.purposes),
        uniquePurposeNames : this.uniquePurposeNamesFormatter(data.data.purposes)
    };

    if(licenceHolderParty.INITIALS != 'null'){
      this.data.licenceHolderInitials = licenceHolderParty.INITIALS
    }

    if(licenceHolderParty.SALUTATION != 'null'){
      this.data.licenceHolderTitle = licenceHolderParty.SALUTATION
    }

    return this.data;
  }

  /**
   * Format licence purposes
   * @param {Array} purposes - from NALD data
   * @return {Array} - formatted unique list of licences
   */
  purposesFormatter(purposes) {
    return purposes.map(item => ({
      name : item.purpose.purpose_tertiary.DESCR,
      periodStart : item.PERIOD_ST_DAY + '/' + item.PERIOD_ST_MONTH,
      periodEnd : item.PERIOD_END_DAY + '/' + item.PERIOD_END_MONTH,
      annualQty : item.ANNUAL_QTY,
      dailyQty : item.DAILY_QTY,
      hourlyQty : item.HOURLY_QTY,
      instantaneousQty : item.INST_QTY,
      points : item.purposePoints.map(item => NALDHelpers.formatAbstractionPoint(item.point_detail))
    }));

  }

  /**
   * Get a list of unique purpose names
   * @param {Array} purposes from NALD data
   * @return {Array} of purpose names
   */
  uniquePurposeNamesFormatter(purposes) {
    const names = purposes.map(item => item.purpose.purpose_tertiary.DESCR);
    return uniqBy(names, item => item);
  }


  /**
   * Formats contact address
   * @param {Object} contactAddress - party/role address
   * @return {Object} reformatted address
   */
  addressFormatter(contactAddress) {
    const {ADDR_LINE1, ADDR_LINE2, ADDR_LINE3 } = contactAddress;
    const {ADDR_LINE4, TOWN, COUNTY, POSTCODE, COUNTRY} = contactAddress;

    return {
      addressLine1 : ADDR_LINE1,
      addressLine2 : ADDR_LINE2,
      addressLine3 : ADDR_LINE3,
      addressLine4 : ADDR_LINE4,
      town : TOWN,
      county : COUNTY,
      postcode: POSTCODE,
      country : COUNTRY
    };
  }

  /**
   * Formats a party name - whether person or organisation
   * @param {Object} party - NALD party / role party
   * @return {Object} contact name
   */
  nameFormatter(party) {
    if(party.APAR_TYPE === 'PER') {
      return {
        contactType : 'Person',
        name : `${ party.SALUTATION } ${ party.FORENAME } ${ party.NAME }`
      }
    }
    if(party.APAR_TYPE === 'ORG') {
      return {
        contactType : 'Organisation',
        name : party.NAME
      }
    }
  }

  /**
   * Contacts formatter
   * Creates a list of contacts from the roles/parties in the NALD data
   */
  contactsFormatter(currentVersion, roles) {
    const contacts = [];

    const licenceHolderParty = find(currentVersion.parties, (party) => {
      return party.ID === currentVersion.ACON_APAR_ID;
    });

    licenceHolderParty.contacts.forEach((contact) => {
      contacts.push({
        type : 'Licence holder',
        ...this.nameFormatter(licenceHolderParty),
        ...this.addressFormatter(contact.party_address)
      });
    });

    roles.forEach((role) => {
      contacts.push({
        type : sentenceCase(role.role_type.DESCR),
        ...this.nameFormatter(role.role_party),
        ...this.addressFormatter(role.role_address)
      });
    });

    return contacts;
  }


  /**
   * Converts a string, e.g 12,456 CMH 12,345 CMA to an array of quantities
   * e.g. [{value : 12345, units : 'CMH'} ...]
   * @param {String} str - quantities string
   * @return {Array} - array of {value, units}
   */
  quantitiesStrToArray(str) {
    const unitNames = {
      CMA : 'cubic metres per year',
      'M3/A' : 'cubic metres per year',
      CMD : 'cubic metres per day',
      'M3/D' : 'cubic metres per day',
      CMH : 'cubic metres per hour',
      'L/S' : 'litres per second'
    };

    const r = /([0-9,\.]+) ?([a-z3\/]+)/ig;
    let result, results = [];
    while ((result = r.exec(str)) !== null) {
      console.log(result);
      results.push({
        value : parseFloat(result[1].replace(/[^0-9\.]/g, '')),
        units : result[2],
        name : unitNames[result[2].toUpperCase()]
      });
    };
    return results;
  }

  /**
   * Max quantities formatter
   * If a licence has a single AGG PP condition, i.e. purposes to purpose within
   * a licence, this extracts the data
   * @param {Array} purposes
   * @return {Array} array of quantities
   */
  aggregateQuantitiesFormatter(purposes) {

    // Get all conditions as array
    const conditions = purposes.reduce((memo, item) => {
      return [...memo, ...item.licenceConditions]
    }, []);

    // Get AGG PP conditions
    const agg = filter(conditions, (item) => {
      return (item.condition_type.CODE === 'AGG') && (item.condition_type.SUBCODE === 'PP');
    });

    // Format
    const formatted = agg.map(item => (
      {
        code : item.condition_type.CODE,
        subCode : item.condition_type.SUBCODE,
        text : item.TEXT,
        parameter1 : item.PARAM1,
        parameter2 : item.PARAM2
      }
    ));

    // Get unique
    const unique = uniqBy(formatted, item => Object.values(item).join(','));

    return unique.length === 1 ? this.quantitiesStrToArray(unique[0].parameter2) : null;
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
        points.push({
          meansOfAbstraction : purposePoint.means_of_abstraction.DESCR,
          ...NALDHelpers.formatAbstractionPoint(purposePoint.point_detail)
        });
      });
    });
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

        const points = purpose.purposePoints.map((purposePoint) => {
          return NALDHelpers.abstractionPointToString(NALDHelpers.formatAbstractionPoint(purposePoint.point_detail));
        });

        purpose.licenceConditions.forEach((condition) => {

          const {CODE : code, SUBCODE : subCode} = condition.condition_type;
          const {TEXT : text, PARAM1 : parameter1, PARAM2 : parameter2} = condition;
          const {DESCR : purposeText} = purpose.purpose.purpose_tertiary;

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

module.exports = NALDTransformer;
