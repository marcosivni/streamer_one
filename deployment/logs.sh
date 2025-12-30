#!/bin/bash
# Script to inspect logs
cd "$(dirname "$0")"
docker compose -p streamerdata logs -f
