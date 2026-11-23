#!/usr/bin/env bash

# My ask: how to fix the deployment error? https://github.com/songswords99/songswords99.github.io/actions/runs/44983217355

gh api -X POST repos/songswords99/songswords99.github.io/pages/builds
gh run list --repo songswords99/songswords99.github.io --limit 1 --json databaseId,status --jq '.[0]'
