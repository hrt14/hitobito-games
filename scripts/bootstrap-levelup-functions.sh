#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-hitobito-levelup}"
TOKEN="${PRIVATE_REQUEST_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo 'PRIVATE_REQUEST_TOKEN GitHub Actions secret is required.' >&2
  exit 1
fi

# Do not attempt to grant IAM roles from CI. The deploy identity must be
# provisioned once by a project administrator; self-escalation is both unsafe
# and impossible with the current least-privilege identity.
required_services=(
  cloudfunctions.googleapis.com
  cloudbuild.googleapis.com
  artifactregistry.googleapis.com
  run.googleapis.com
  eventarc.googleapis.com
  pubsub.googleapis.com
  secretmanager.googleapis.com
)

if ! gcloud services list --enabled --project "$PROJECT_ID" --format='value(config.name)' >/tmp/enabled-services 2>/tmp/service-error; then
  echo 'Cannot inspect enabled Google Cloud APIs.' >&2
  echo 'Grant the deploy identity Cloud Functions Admin and Service Account User; if Service Usage access is still denied, also grant Service Usage Admin.' >&2
  cat /tmp/service-error >&2 || true
  exit 1
fi

for service in "${required_services[@]}"; do
  if grep -Fxq "$service" /tmp/enabled-services; then
    echo "Required API already enabled: $service"
    continue
  fi
  echo "Enabling required API $service"
  if ! gcloud services enable "$service" --project "$PROJECT_ID" --quiet; then
    echo "Cannot enable $service. A project administrator must enable it or grant Service Usage Admin to the deploy identity." >&2
    exit 1
  fi
done

if gcloud secrets describe PRIVATE_REQUEST_TOKEN --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo 'PRIVATE_REQUEST_TOKEN already exists in Secret Manager; keeping current version.'
else
  echo 'Creating PRIVATE_REQUEST_TOKEN in Secret Manager from the existing GitHub Actions secret.'
  if ! printf '%s' "$TOKEN" | gcloud secrets create PRIVATE_REQUEST_TOKEN \
    --project "$PROJECT_ID" \
    --replication-policy=automatic \
    --data-file=- \
    --quiet >/dev/null; then
    echo 'Cannot create PRIVATE_REQUEST_TOKEN. Grant Secret Manager Admin to the deploy identity, or create this secret once in Google Cloud Secret Manager.' >&2
    exit 1
  fi
fi

if ! gcloud secrets versions access latest --secret=PRIVATE_REQUEST_TOKEN --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo 'PRIVATE_REQUEST_TOKEN exists but the deploy identity cannot access it. Grant Secret Manager Secret Accessor (or Secret Manager Admin during bootstrap).' >&2
  exit 1
fi

echo 'Firebase Functions API/secret bootstrap complete; no IAM roles were modified by CI.'
