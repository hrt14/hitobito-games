#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-hitobito-levelup}"
DEPLOYER="github-firebase-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
TOKEN="${PRIVATE_REQUEST_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo 'PRIVATE_REQUEST_TOKEN GitHub Actions secret is required.' >&2
  exit 1
fi

roles=(
  roles/serviceusage.serviceUsageAdmin
  roles/cloudfunctions.admin
  roles/run.admin
  roles/cloudbuild.builds.editor
  roles/artifactregistry.admin
  roles/eventarc.admin
  roles/pubsub.admin
  roles/iam.serviceAccountUser
  roles/secretmanager.admin
)

for role in "${roles[@]}"; do
  echo "Ensuring $DEPLOYER has $role"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com \
  --project "$PROJECT_ID" \
  --quiet

if ! gcloud secrets describe PRIVATE_REQUEST_TOKEN --project "$PROJECT_ID" >/dev/null 2>&1; then
  printf '%s' "$TOKEN" | gcloud secrets create PRIVATE_REQUEST_TOKEN \
    --project "$PROJECT_ID" \
    --replication-policy=automatic \
    --data-file=- \
    --quiet >/dev/null
  echo 'Created PRIVATE_REQUEST_TOKEN in Secret Manager.'
else
  echo 'PRIVATE_REQUEST_TOKEN already exists in Secret Manager; keeping current version.'
fi

# Verify that the secret can be read by the deploy identity before Firebase binds it to the function runtime.
gcloud secrets versions access latest --secret=PRIVATE_REQUEST_TOKEN --project "$PROJECT_ID" >/dev/null

echo 'Firebase Functions IAM/API/secret bootstrap complete.'
