Digitise! gauging station list scrips
=====================================


1. Checking data before update
------------------------------

This script checks for changes between a new CSV file and the existing JSON schema file in the project.

Usage:

```
node ./scripts/stations check stations.csv
```

A report is generated at ./station-change-report.csv

`Note`: Ensure the report is not committed to source control

2. Updating the schema
----------------------

It loads and parses a CSV source file of stations, and updates the JSON schema in the project.

Usage:

```
node ./scripts/stations update path/to/stations-list.csv 
```
