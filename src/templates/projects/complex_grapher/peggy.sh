#!/bin/bash

peggy -o pretty.js grammar.pegjs
#uglifyjs pretty.js > grammar.js
#rm pretty.js
mv pretty.js grammar.js
