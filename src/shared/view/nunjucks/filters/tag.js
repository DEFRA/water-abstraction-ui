const { isObject, compact } = require('lodash');

const colourMap = {
  dark: 'govuk-tag--grey',
  success: 'govuk-tag--green',
  error: 'govuk-tag--red',
  warning: 'govuk-tag--orange'
};

const sizeMap = {
  large: 'govuk-!-font-size-27'
};

/**
 * Maps original badge implementation to new gov-uk tag
 */
const mapBadgeToTag = (param, status) => {
  const options = isObject(param) ? param : {
    text: param,
    status
  };

  const cssClasses = [
    colourMap[options.status] || 'govuk-tag--blue',
    sizeMap[options.size]
  ];

  // see https://design-system.service.gov.uk/components/tag/
  return {
    text: options.text,
    classes: compact(cssClasses).join(' ')
  };
};

module.exports.mapBadgeToTag = mapBadgeToTag;
