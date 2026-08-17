#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="hitobito-levelup"
REPO="hrt14/hitobito-games"
POOL_ID="hitobito-github"
PROVIDER_ID="hitobito-games"
SA_NAME="github-firebase-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

printf '\n[1/6] Selecting project...\n'
gcloud config set project "$PROJECT_ID" >/dev/null

printf '[2/6] Enabling required Google APIs...\n'
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com --project="$PROJECT_ID" >/dev/null

printf '[3/6] Creating deploy service account if needed...\n'
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT_ID" --display-name="GitHub Firebase Hosting deployer" >/dev/null
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebasehosting.admin" \
  --condition=None --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/serviceusage.apiKeysViewer" \
  --condition=None --quiet >/dev/null

printf '[4/6] Creating GitHub Workload Identity Pool if needed...\n'
if ! gcloud iam workload-identity-pools describe "$POOL_ID" --project="$PROJECT_ID" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" \
    --location=global \
    --display-name="hitobito GitHub Actions" >/dev/null
fi

printf '[5/6] Creating repository-restricted OIDC provider if needed...\n'
if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" --project="$PROJECT_ID" --location=global --workload-identity-pool="$POOL_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_ID" \
    --display-name="hitobito-games GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository == '${REPO}'" \
    --issuer-uri="https://token.actions.githubusercontent.com" >/dev/null
fi

POOL_NAME="$(gcloud iam workload-identity-pools describe "$POOL_ID" --project="$PROJECT_ID" --location=global --format='value(name)')"
PROVIDER_NAME="$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" --project="$PROJECT_ID" --location=global --workload-identity-pool="$POOL_ID" --format='value(name)')"

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${REPO}" \
  --quiet >/dev/null

printf '\n[6/6] DONE\n'
printf 'PROJECT_ID=%s\n' "$PROJECT_ID"
printf 'SERVICE_ACCOUNT=%s\n' "$SA_EMAIL"
printf 'WORKLOAD_IDENTITY_PROVIDER=%s\n' "$PROVIDER_NAME"
printf '\nSend a screenshot of these three lines back to ChatGPT.\n'
