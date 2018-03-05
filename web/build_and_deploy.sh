#!/bin/sh

cd web
gulp
cd ..
cp build/contracts/HireMe.json web/project/
git add -A .
git commit -m "${1}"
git subtree push --prefix web heroku master
