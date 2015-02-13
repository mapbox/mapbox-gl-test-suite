#!/usr/bin/env bash

set -e
set -o pipefail

REPO_NAME=$(basename $TRAVIS_REPO_SLUG)

aws s3 cp tests/ s3://mapbox/$REPO_NAME/tests/$TRAVIS_JOB_NUMBER/ --acl public-read --recursive > /dev/null

echo http://mapbox.s3.amazonaws.com/$REPO_NAME/tests/$TRAVIS_JOB_NUMBER/index.html
