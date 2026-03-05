#!/usr/bin/env sh

set -e

bun install --frozen-lockfile
bun lint
bun check
