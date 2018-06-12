
# water-abstraction
[![Maintainability](https://api.codeclimate.com/v1/badges/cbb2d0b03cc084ad17a3/maintainability)](https://codeclimate.com/github/DEFRA/water-abstraction-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/cbb2d0b03cc084ad17a3/test_coverage)](https://codeclimate.com/github/DEFRA/water-abstraction-ui/test_coverage)

[![Build Status](https://travis-ci.org/DEFRA/water-abstraction-ui.svg?branch=master)](https://travis-ci.org/DEFRA/water-abstraction-ui)

[![Known Vulnerabilities](https://snyk.io/test/github/DEFRA/water-abstraction-ui/badge.svg)](https://snyk.io/test/github/DEFRA/water-abstraction-ui)

Project for the GOV.UK Water Abstraction service

## Installation

If on Windows you will need to open powershell with administrator privileges and run this command. This is a prerequisite for bcrypt.

```
npm install --global --production windows-build-tools
```

On all platforms run:

```
npm install --only=dev
gulp clean && gulp copy-govuk-files && gulp install-govuk-files && gulp copy-static-assets && gulp sass
```

## Environment variables

A `.env` file should be created in the root directory with the following optional configuration variables

### PORT
Specify the port for the service to run on

`PORT=[port]`

### cacheKey
32+ characters used to secure session variables

`cacheKey=a-string-of-at-least-32-characters`

### JWT_TOKEN
The JWT used in requests to the permit repository API

### apiURI
The URI for the permit repostiory. This should probably end '/API/1.0/'

### idmURI
The URI for the tactical IDM. This should probably end '/IDM/1.0/'

### licenceOrgId
The organisation ID for the Water Licensing organisation in the permit repository. This can be found in the org table.

### licenceTypeId
The type ID for abstraction licences in the permit repository. This can be found in the type table.

### cookie_secret
A random string used for cookie encryption

### test_username
The username for a test account for unit testing

### test_password
The password for a test account for unit testing

### test_entity_id
The entity ID in the CRM of the user corresponding to the test_username and test_password above

### test_licence_id
A licence guid accessible to the test user above

### query_access
The access code for entry in private beta


## Launching

`node index.js`

## Security

A valid JWT token is required for requests to the API. This should be appended to the URL in the format /API/1.0/org?token=[insert token here].

Please note that a mechanism for obtaining the JWT token is not yet in place.

## Contributing to this project

Please read the [contribution guidelines](/CONTRIBUTING.md) before submitting a pull request.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
