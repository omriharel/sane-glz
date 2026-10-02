#!/usr/bin/env bash
# Delete the AWS backend of the old (2020) version of the app: the GLZ API proxy and the
# sign-in/sync feature. Nothing here is used since the app moved to Omny's public API.
# Every resource is named explicitly. Dry run by default; pass --yes to actually delete.
set -euo pipefail

REGION=eu-central-1
API_ID=qbl6dnzy8d
LAMBDAS=(sane-glz-proxy saneglz-get-userdata)
LOG_GROUPS=(/aws/lambda/sane-glz-proxy /aws/lambda/sane-glz-proxy-get-programmes /aws/lambda/saneglz-get-userdata)
USER_POOL_ID=eu-central-1_oQOF2IBAz
USER_POOL_DOMAIN=saneglz
USERDATA_BUCKET=sane-glz-userdata
ROLE=lambda-invoke-function-assume-apigw-role

export AWS_PAGER=""
export AWS_DEFAULT_REGION=$REGION

DRY_RUN=true
[[ "${1:-}" == "--yes" ]] && DRY_RUN=false

run() {
  if $DRY_RUN; then
    echo "  would run: aws $*"
  else
    echo "  aws $*"
    aws "$@"
  fi
}

exists() { "$@" >/dev/null 2>&1; }

$DRY_RUN && echo "DRY RUN -- nothing will be deleted. Re-run with --yes to delete."

echo "HTTP API $API_ID"
if exists aws apigatewayv2 get-api --api-id "$API_ID"; then
  run apigatewayv2 delete-api --api-id "$API_ID"
else
  echo "  already gone"
fi

for name in "${LAMBDAS[@]}"; do
  echo "Lambda $name"
  if exists aws lambda get-function --function-name "$name"; then
    run lambda delete-function --function-name "$name"
  else
    echo "  already gone"
  fi
done

for group in "${LOG_GROUPS[@]}"; do
  echo "Log group $group"
  if [[ -n "$(aws logs describe-log-groups --log-group-name-prefix "$group" --query "logGroups[?logGroupName=='$group'].logGroupName" --output text)" ]]; then
    run logs delete-log-group --log-group-name "$group"
  else
    echo "  already gone"
  fi
done

echo "Cognito user pool $USER_POOL_ID (and its users and Google identity provider)"
if exists aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID"; then
  if exists aws cognito-idp describe-user-pool-domain --domain "$USER_POOL_DOMAIN" --query 'DomainDescription.UserPoolId' --output text; then
    run cognito-idp delete-user-pool-domain --domain "$USER_POOL_DOMAIN" --user-pool-id "$USER_POOL_ID"
  fi
  run cognito-idp delete-user-pool --user-pool-id "$USER_POOL_ID"
else
  echo "  already gone"
fi

echo "S3 bucket $USERDATA_BUCKET (synced user preferences, no backup)"
if exists aws s3api head-bucket --bucket "$USERDATA_BUCKET"; then
  run s3 rm "s3://$USERDATA_BUCKET" --recursive
  run s3api delete-bucket --bucket "$USERDATA_BUCKET"
else
  echo "  already gone"
fi

echo "IAM role $ROLE"
if exists aws iam get-role --role-name "$ROLE"; then
  POLICY_ARNS=$(aws iam list-attached-role-policies --role-name "$ROLE" --query 'AttachedPolicies[].PolicyArn' --output text)
  for arn in $POLICY_ARNS; do
    run iam detach-role-policy --role-name "$ROLE" --policy-arn "$arn"
  done
  for inline in $(aws iam list-role-policies --role-name "$ROLE" --query 'PolicyNames' --output text); do
    run iam delete-role-policy --role-name "$ROLE" --policy-name "$inline"
  done
  run iam delete-role --role-name "$ROLE"

  # The managed policies may be shared with something else; only delete them if this role was their only user
  for arn in $POLICY_ARNS; do
    [[ "$arn" == arn:aws:iam::aws:* ]] && continue
    OTHER_USERS=$(aws iam list-entities-for-policy --policy-arn "$arn" \
      --query "length([PolicyGroups[], PolicyUsers[], PolicyRoles[?RoleName!='$ROLE']][])" --output text)
    echo "Policy $arn"
    if [[ "$OTHER_USERS" != "0" ]]; then
      echo "  still attached to $OTHER_USERS other user(s)/group(s)/role(s); keeping it"
      continue
    fi
    for version in $(aws iam list-policy-versions --policy-arn "$arn" --query 'Versions[?!IsDefaultVersion].VersionId' --output text); do
      run iam delete-policy-version --policy-arn "$arn" --version-id "$version"
    done
    run iam delete-policy --policy-arn "$arn"
  done
else
  echo "  already gone"
fi

echo
$DRY_RUN && echo "DRY RUN complete. Re-run with --yes to delete the above." || echo "Teardown complete."
