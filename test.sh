#!/bin/sh

. venv/bin/activate
export FLASK_APP=src/main
export FLASK_ENV=development
flask run