// eslint-disable-next-line promise/param-names
const sleepFor = duration => new Promise(sitTight => setTimeout(sitTight, duration));

exports.sleepFor = sleepFor;
