'use strict';

const { program } = require('commander');
const parse = require('csv-parse/lib/sync');
const { sortBy } = require('lodash');
const fs = require('fs');

program.version('0.1');

const destinationFile = 'src/internal/modules/abstraction-reform/schema/types/gauging-stations.json';

const mapCsvRow = csvRow => ({
  id: csvRow.SUID,
  value: csvRow.stationName
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

const updateHandler = async csvFile => {
  console.log(`Working directory is ${process.cwd()}`);
  const csvFileData = fs.readFileSync(csvFile);
  const csvData = parse(csvFileData, { columns: true });
  const jsonSchema = getSchemaFromCsvData(csvData);
  fs.writeFileSync(destinationFile, JSON.stringify(jsonSchema, null, 2));
  console.log(`${jsonSchema.enum.length} stations written to ${destinationFile}`);
};

program
  .command('update <csv-file>')
  .description('Updates the gauging station list')
  .action(updateHandler);

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
