#!/bin/bash

cd "$(dirname "$0")" || exit

export $(grep -v '^#' ../water-abstraction-orchestration/secrets/.env | xargs)
DISPLAY=$IP:0

#docker rm cypress:1
DOCKER_BUILDKIT=0 docker build -f cypress.Dockerfile -t cypress:1 .

docker run \
  --env DISPLAY \
  -w /e2e \
  --env JWT_TOKEN=$JWT_TOKEN \
  --env NOTIFY_CALLBACK_TOKEN=$NOTIFY_CALLBACK_TOKEN \
  --env WATER_URI=$WATER_URI \
  --env ADMIN_URI=$ADMIN_URI \
  --env USER_URI=$USER_URI \
  cypress:1 \
    "node_modules/.bin/cypress run --spec \"cypress/integration/internal/remove-individual-licence-from-bill.spec.js\" --config baseUrl=${BASE_URL}"

