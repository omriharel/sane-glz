#!/usr/bin/env bash
# One-time setup of static hosting for glz.omri.io: ACM cert, private S3 bucket, and a
# CloudFront distribution reading from it through Origin Access Control.
# Safe to re-run: each step reuses what already exists. Doesn't touch DNS for the site
# itself; run point-dns.sh once the CloudFront URL checks out.
# Needs AWS CLI v2 recent enough to have `aws cloudfront create-origin-access-control`.
set -euo pipefail

DOMAIN=glz.omri.io
BUCKET=omriharel-glz.omri.io-bucket
REGION=eu-central-1
HOSTED_ZONE_ID=Z007689538KZ10GUI0SPR # omri.io
OAC_NAME=sane-glz-oac
# AWS managed "CachingOptimized" policy
CACHE_POLICY_ID=658327ea-f89d-4fab-a63d-7e88639e58f6
TAGS_KV='Key=project,Value=sane-glz'
ENV_FILE="$(dirname "$0")/hosting.env"

export AWS_PAGER=""

step() { printf '\n== %s\n' "$*"; }

step "ACM certificate for $DOMAIN (us-east-1, required by CloudFront)"
CERT_ARN=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" --output text)
if [[ "$CERT_ARN" == "None" ]]; then
  CERT_ARN=$(aws acm request-certificate --region us-east-1 --domain-name "$DOMAIN" \
    --validation-method DNS --tags "$TAGS_KV" --query CertificateArn --output text)
  echo "requested $CERT_ARN"
else
  echo "reusing $CERT_ARN"
fi

# The validation record shows up on the certificate a few seconds after the request
for _ in $(seq 1 30); do
  VALIDATION=$(aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord.[Name,Value]' --output text)
  [[ "$VALIDATION" != "None" ]] && break
  sleep 2
done
read -r VALIDATION_NAME VALIDATION_VALUE <<<"$VALIDATION"
echo "validation record: $VALIDATION_NAME CNAME $VALIDATION_VALUE"
aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch "{
  \"Comment\": \"ACM validation for $DOMAIN\",
  \"Changes\": [{\"Action\": \"UPSERT\", \"ResourceRecordSet\": {
    \"Name\": \"$VALIDATION_NAME\", \"Type\": \"CNAME\", \"TTL\": 300,
    \"ResourceRecords\": [{\"Value\": \"$VALIDATION_VALUE\"}]}}]
}" --query ChangeInfo.Status --output text
echo "waiting for validation (usually a few minutes)..."
aws acm wait certificate-validated --region us-east-1 --certificate-arn "$CERT_ARN"
echo "certificate issued"

step "S3 bucket $BUCKET (private; new buckets get SSE-S3 encryption by default)"
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "exists"
else
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=$REGION" --query Location --output text
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging 'TagSet=[{Key=project,Value=sane-glz}]'

step "CloudFront origin access control $OAC_NAME"
OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id | [0]" --output text)
if [[ "$OAC_ID" == "None" ]]; then
  OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config \
    "Name=$OAC_NAME,Description=sane-glz bucket access,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query OriginAccessControl.Id --output text)
  echo "created $OAC_ID"
else
  echo "reusing $OAC_ID"
fi

step "CloudFront distribution for $DOMAIN"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$DOMAIN')].Id | [0]" --output text)
if [[ "$DISTRIBUTION_ID" == "None" ]]; then
  ORIGIN_ID=s3-$BUCKET
  # Pay-as-you-go, no WAF, no logging: nothing here carries a fixed monthly cost.
  # 403/404 -> index.html lets the SPA handle deep links like /settings.
  DISTRIBUTION_CONFIG=$(cat <<EOF
{
  "DistributionConfig": {
    "CallerReference": "sane-glz-$(date +%s)",
    "Comment": "sane-glz ($DOMAIN)",
    "Enabled": true,
    "Aliases": {"Quantity": 1, "Items": ["$DOMAIN"]},
    "DefaultRootObject": "index.html",
    "Origins": {"Quantity": 1, "Items": [{
      "Id": "$ORIGIN_ID",
      "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
      "S3OriginConfig": {"OriginAccessIdentity": ""},
      "OriginAccessControlId": "$OAC_ID"
    }]},
    "DefaultCacheBehavior": {
      "TargetOriginId": "$ORIGIN_ID",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "$CACHE_POLICY_ID",
      "Compress": true,
      "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],
        "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
    },
    "CustomErrorResponses": {"Quantity": 2, "Items": [
      {"ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10},
      {"ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10}
    ]},
    "ViewerCertificate": {
      "ACMCertificateArn": "$CERT_ARN",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "PriceClass": "PriceClass_100",
    "HttpVersion": "http2and3",
    "IsIPV6Enabled": true
  },
  "Tags": {"Items": [{"Key": "project", "Value": "sane-glz"}]}
}
EOF
)
  DISTRIBUTION_ID=$(aws cloudfront create-distribution-with-tags \
    --distribution-config-with-tags "$DISTRIBUTION_CONFIG" --query Distribution.Id --output text)
  echo "created $DISTRIBUTION_ID"
else
  echo "reusing $DISTRIBUTION_ID"
fi
DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query Distribution.DomainName --output text)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

step "Bucket policy: only this distribution may read"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"AllowCloudFrontRead\",
    \"Effect\": \"Allow\",
    \"Principal\": {\"Service\": \"cloudfront.amazonaws.com\"},
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET/*\",
    \"Condition\": {\"StringEquals\": {\"AWS:SourceArn\": \"arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID\"}}
  }]
}"

cat >"$ENV_FILE" <<EOF
# Written by setup-hosting.sh; read by deploy.sh and point-dns.sh
BUCKET=$BUCKET
DISTRIBUTION_ID=$DISTRIBUTION_ID
DISTRIBUTION_DOMAIN=$DISTRIBUTION_DOMAIN
DOMAIN=$DOMAIN
HOSTED_ZONE_ID=$HOSTED_ZONE_ID
EOF

step "Done"
echo "distribution $DISTRIBUTION_ID at https://$DISTRIBUTION_DOMAIN (takes a few minutes to deploy)"
echo "settings saved to $ENV_FILE"
echo "next: scripts/deploy.sh, check https://$DISTRIBUTION_DOMAIN, then scripts/point-dns.sh"
