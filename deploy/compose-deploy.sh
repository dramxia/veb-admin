#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir/.."

compose_wait_timeout=${COMPOSE_WAIT_TIMEOUT:-300}
image_prune_until=${DOCKER_IMAGE_PRUNE_UNTIL:-24h}
build_cache_max_size=${DOCKER_BUILD_CACHE_MAX_SIZE:-8GB}
build_cache_max_age=${DOCKER_BUILD_CACHE_MAX_AGE:-168h}
compose_env_file=${COMPOSE_ENV_FILE:-.env.production}

if [ ! -f "$compose_env_file" ]; then
  echo "Compose environment file not found: $compose_env_file" >&2
  exit 1
fi

docker compose --env-file "$compose_env_file" up \
  --build \
  --detach \
  --remove-orphans \
  --wait \
  --wait-timeout "$compose_wait_timeout"

# Successful one-shot jobs are no longer needed once all services are healthy.
docker compose --env-file "$compose_env_file" rm --force migrate

if [ "${DOCKER_DEPLOY_PRUNE:-1}" = "1" ]; then
  # This removes only untagged images; named rollback images and volumes remain.
  docker image prune --force --filter "until=$image_prune_until"

  if docker builder prune --help 2>&1 | grep -q -- '--max-used-space'; then
    docker builder prune --force --max-used-space "$build_cache_max_size"
  else
    docker builder prune --force --filter "until=$build_cache_max_age"
  fi
fi
