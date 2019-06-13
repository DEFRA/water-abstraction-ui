// contains generic functions unrelated to a specific component
const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.exec = exec;
