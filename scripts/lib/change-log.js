'use strict';

const createChangeLog = (baseSchema, comparisonSchema) => {
  const maps = {
    base: createMaps(baseSchema),
    comparison: createMaps(comparisonSchema)
  };

  const log = [];

  maps.comparison.id.forEach((name, key) => {
    const normalisedName = getNormalisedName(name);
    if (maps.base.id.has(key)) {
      if (name !== maps.base.id.get(key)) {
        log.push({
          suid: key,
          message: `Station name changed from ${maps.base.id.get(key)}`,
          newName: name,
          originalSuid: null
        });
      }
    } else if (maps.base.name.has(normalisedName)) {
      log.push({
        suid: key,
        message: `Station SUID changed for ${name}`,
        newName: null,
        originalSuid: maps.base.name.get(normalisedName)
      });
    }
  });
  maps.base.id.forEach((name, key) => {
    if (!maps.comparison.id.has(key)) {
      log.push({
        suid: key,
        message: `Station SUID has been removed for ${name}`,
        newName: null,
        originalSuid: null
      });
    }
  });

  return log;
};

const createMaps = jsonSchema => ({
  id: mapById(jsonSchema),
  name: mapByNormalisedName(jsonSchema)
});

const mapById = jsonSchema => jsonSchema.enum.reduce((map, row) =>
  map.set(row.id, row.value)
, new Map());

const mapByNormalisedName = jsonSchema => jsonSchema.enum.reduce((map, row) =>
  map.set(getNormalisedName(row.value), row.id)
, new Map());

const getNormalisedName = name => name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

exports.createChangeLog = createChangeLog;
