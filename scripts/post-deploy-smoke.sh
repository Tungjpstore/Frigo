#!/usr/bin/env bash
# Post-deploy smoke for staging and production. READ-ONLY: it only performs
# anonymous GET requests against public endpoints; it creates no data and
# requires no credentials.
#
# Usage: bash scripts/post-deploy-smoke.sh <base-url>
set -euo pipefail

BASE_URL="${1:?usage: post-deploy-smoke.sh <base-url>}"

echo "== Frigo post-deploy smoke: ${BASE_URL} =="

expect_http() { # name url expected_status
  local name="$1" url="$2" expected="$3" code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$url")"
  if [[ "$code" != "$expected" ]]; then
    echo "FAIL ${name}: expected HTTP ${expected}, got ${code} (${url})"
    exit 1
  fi
  echo "ok ${name}: HTTP ${code}"
}

expect_http "landing page" "${BASE_URL}/" 200
expect_http "public liveness" "${BASE_URL}/api/v1/health" 200

# Readiness: status must be ok or degraded (never unhealthy) and the D1
# database must answer. The body is sanitized (no secrets) by construction.
curl -sS --max-time 15 "${BASE_URL}/api/v1/health/ready" | node --input-type=module -e '
  let input = "";
  for await (const chunk of process.stdin) input += chunk;

  let body;
  try {
    body = JSON.parse(input);
  } catch {
    console.error("FAIL readiness: response is not valid JSON");
    process.exit(1);
  }

  if (body.status === "unhealthy") {
    console.error("FAIL readiness: status is unhealthy");
    process.exit(1);
  }
  if (body.services?.database !== "ok") {
    console.error("FAIL readiness: database is not ok:", body.services?.database);
    process.exit(1);
  }
  if (body.config && body.config.ok === false && body.config.issues?.some((i) => i.severity === "fatal")) {
    console.error("FAIL readiness: fatal configuration issues:", JSON.stringify(body.config.issues));
    process.exit(1);
  }
  console.log("ok readiness:", body.status, "database:", body.services.database, "environment:", body.environment || "unknown");
'

echo "== Smoke passed =="
