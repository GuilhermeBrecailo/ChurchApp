#!/bin/sh
set -eu

: "${API_URL:?API_URL must be provided by the controller}"
: "${WEB_URL:?WEB_URL must be provided by the controller}"
: "${KEYCLOAK_URL:?KEYCLOAK_URL must be provided by the controller}"

check_http() {
  name=$1
  url=$2
  if ! curl --fail --silent --show-error --max-time 10 "$url" >/dev/null; then
    echo "smoke check failed: $name" >&2
    exit 1
  fi
}

check_http api "$API_URL/status"
check_http web "$WEB_URL/login"
check_http keycloak "$KEYCLOAK_URL/realms/master"
echo "ChurchApp smoke checks passed"
