'use strict';

const util = require('util');
const { program } = require('commander');
const parse = require('csv-parse/lib/sync');
const csvStringify = util.promisify(require('csv-stringify'));
const { sortBy } = require('lodash');
const fs = require('fs');

const { createChangeLog } = require('./lib/change-log');

program.version('0.1');

const destinationFile = 'src/internal/modules/abstraction-reform/schema/types/gauging-stations.json';

const checkHandler = async csvFile => {
  const csvData = getCsvData(csvFile);
  const log = createChangeLog(
    JSON.parse(fs.readFileSync(destinationFile)),
    getSchemaFromCsvData(csvData)
  );
  await writeLogToCsv(log);
};

const writeLogToCsv = async log => {
  const str = await csvStringify(log, { header: true });
  fs.writeFileSync('./station-change-report.csv', str);
  console.log('File written');
};

const mapCsvRow = csvRow => ({
  id: csvRow.SUID.trim(),
  value: csvRow.stationName.trim()
});

const getSchemaFromCsvData = csvData => {
  const stations = sortBy(
    csvData.map(mapCsvRow),
    'value'
  );
  return ({
    type: 'object',
    defaultEmpty: true,
    errors: {
      required: {
        message: 'Enter a gauging station'
      }
    },
    enum: stations
  });
};

const getCsvData = csvFile => {
  console.log(`Working directory is ${process.cwd()}`);
  const csvFileData = fs.readFileSync(csvFile);
  return parse(csvFileData, { columns: true });
};

const updateHandler = csvFile => {
  const csvData = getCsvData(csvFile);
  const jsonSchema = getSchemaFromCsvData(csvData);
  fs.writeFileSync(destinationFile, JSON.stringify(jsonSchema, null, 2));
  console.log(`${jsonSchema.enum.length} stations written to ${destinationFile}`);
};

program
  .command('update <csv-file>')
  .description('Updates the gauging station list')
  .action(updateHandler);

program
  .command('check <csv-file>')
  .description('Checks new CSV gauging station list against currently imported list')
  .action(checkHandler);

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
