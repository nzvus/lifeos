#!/usr/bin/env sh
# Repo health check (macOS/Linux). Usage: ./check.sh [--strict]
cd "$(dirname "$0")" && exec python3 scripts/check.py "$@"
