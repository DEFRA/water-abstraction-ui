const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const deleteFile = util.promisify(fs.unlink);

exports.readFile = readFile;
exports.deleteFile = deleteFile;
