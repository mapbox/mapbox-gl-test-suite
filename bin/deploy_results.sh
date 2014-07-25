#!/usr/bin/env bash

set -e
set -o pipefail

aws s3 cp tests/ s3://mapbox-gl-testing/headless/$TRAVIS_REPO_SLUG/$TRAVIS_JOB_NUMBER/ --acl public-read --recursive > /dev/null

echo http://mapbox-gl-testing.s3.amazonaws.com/headless/$TRAVIS_REPO_SLUG/$TRAVIS_JOB_NUMBER/index.html
