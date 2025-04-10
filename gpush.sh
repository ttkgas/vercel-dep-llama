#!/bin/bash


FILE=${1:-.}
MESSAGE=${2:-"verc"}
BRANCH=${3:-main}

git add "$FILE"

git commit -m "$MESSAGE"

git push origin "$BRANCH"
