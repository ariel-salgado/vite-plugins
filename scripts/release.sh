#!/bin/usr/env bash

set -e

get_version() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('./package.json','utf8')).version)"
}

bump_version() {
  echo "Bumping version..."
  bunx bumpp --no-commit --no-tag --no-push --yes
}

commit_and_tag() {
  local version="$1"
  echo "Publishing succeeded, committing and tagging v$version..."
  git add package.json
  git commit -m "release: v$version"
  git tag "v$version"
  git push
  git push --tags
}

revert_version() {
  local old_version="$1"
  echo "Publish failed. Reverting package.json to v$old_version..."
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('./package.json','utf8'));
    pkg.version = '$old_version';
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
}

publish_package() {
  local version="$1"
  shift

  if echo "$version" | grep -qE '\-(alpha|beta|rc|next|canary)'; then
    echo "Publishing prerelease version $version with --tag next..."
    bun publish --tag next "$@"
  else
    echo "Publishing stable version $version..."
    bun publish "$@"
  fi
}

main() {
  OLD_VERSION=$(get_version)
  bump_version
  NEW_VERSION=$(get_version)

  echo "Preparing to publish version $NEW_VERSION..."

  if publish_package "$NEW_VERSION" "$@"; then
    commit_and_tag "$NEW_VERSION"
  else
    revert_version "$OLD_VERSION"
    exit 1
  fi
}

main "$@"
