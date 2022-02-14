const chargePurposesDescriptions = elements => elements
  .map(element => element.description)
  .join(',\n');

exports.chargePurposesDescriptions = chargePurposesDescriptions;
