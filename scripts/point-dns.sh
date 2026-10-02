#!/usr/bin/env bash
# Point glz.omri.io at the CloudFront distribution. This record is more specific than
# the *.omri.io wildcard (which points at the droplet), so it takes over just this name.
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/hosting.env
export AWS_PAGER=""

CLOUDFRONT_HOSTED_ZONE_ID=Z2FDTNDATAQYW2 # fixed for all CloudFront distributions

record() {
  cat <<JSON
{"Action": "UPSERT", "ResourceRecordSet": {"Name": "$DOMAIN", "Type": "$1", "AliasTarget": {
  "HostedZoneId": "$CLOUDFRONT_HOSTED_ZONE_ID", "DNSName": "$DISTRIBUTION_DOMAIN", "EvaluateTargetHealth": false}}}
JSON
}

CHANGE_ID=$(aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch "{\"Comment\": \"$DOMAIN -> CloudFront\", \"Changes\": [$(record A), $(record AAAA)]}" \
  --query ChangeInfo.Id --output text)
aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
echo "$DOMAIN now points at $DISTRIBUTION_DOMAIN"
