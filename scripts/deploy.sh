#!/usr/bin/env bash
# Build the app and publish it to the S3 bucket behind CloudFront.
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/hosting.env
export AWS_PAGER=""

npm ci
npm run build

# Hashed assets first, cached forever. Old ones are kept so tabs still running a
# previous version can lazy-load what they reference.
aws s3 sync dist/assets "s3://$BUCKET/assets" \
  --cache-control 'public,max-age=31536000,immutable'

# Everything else (index.html, manifest, icons) is revalidated on every load.
aws s3 sync dist "s3://$BUCKET" --exclude 'assets/*' --delete \
  --cache-control 'no-cache'

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
  --paths /index.html /manifest.json --query Invalidation.Id --output text

echo "deployed to https://$DOMAIN (and https://$DISTRIBUTION_DOMAIN)"
