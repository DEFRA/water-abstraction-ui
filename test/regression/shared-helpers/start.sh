#!/bin/bash
declare -a arr=("water-abstraction-permit-repository"
"water-abstraction-service"
"water-abstraction-tactical-crm"
"water-abstraction-tactical-idm"
"water-abstraction-returns"
"water-abstraction-import"
)

pm2 start ecosystem.config.json;

for i in "${arr[@]}"
do
  cd $i;
  echo $i;
  pm2 start ecosystem.config.json;
  printf "\n----------------------------------------\n";
  cd ../;
done

pm2 save
Collapse




