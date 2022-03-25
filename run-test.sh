#!/bin/bash

cd "$(dirname "$0")" || exit

export $(grep -v '^#' ../water-abstraction-orchestration/secrets/.env | xargs)
export $(grep -v '^#' ../water-abstraction-orchestration/shared/variables.env | xargs)

npm run test:cypress
