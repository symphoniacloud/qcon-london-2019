#!/bin/bash

set -e

REGION=$1

[ -z ${REGION} ] \
    && echo "REGION argument not provided" \
    && exit 1

SAM_BUCKET=$(aws cloudformation describe-stack-resources \
    --region ${REGION} \
    --stack-name sam-bootstrap \
    --query 'StackResources[?LogicalResourceId==`Bucket`].PhysicalResourceId' \
    --output text)

[ -z ${SAM_BUCKET} ] \
    && echo "SAM S3 bucket not found" \
    && exit 1

rm -rf dist
npm run package

aws cloudformation package \
    --s3-bucket ${SAM_BUCKET} \
    --template-file template.yaml \
    --output-template-file dist/template-packaged.yaml

aws cloudformation deploy \
    --region ${REGION} \
    --capabilities CAPABILITY_IAM \
    --template-file dist/template-packaged.yaml \
    --stack-name serverless-application