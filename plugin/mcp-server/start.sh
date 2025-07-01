#!/bin/bash

# Load environment variables from .env file and start the server
export $(grep -v '^#' .env | xargs)
npm start
