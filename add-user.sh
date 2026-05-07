#!/bin/bash

# Script to add a new user to both AWS Cognito and the database

set -e

echo "=========================================="
echo "Add New User to Provider Performance OS"
echo "=========================================="
echo ""

# Get user details
read -p "Email address: " EMAIL
read -p "Full name: " FULLNAME
read -p "Role (admin/executive/analyst): " ROLE
read -p "Organization ID (default: 1): " ORG_ID
ORG_ID=${ORG_ID:-1}
read -p "Temporary password (min 8 chars, uppercase, lowercase, number, special): " TEMP_PASSWORD

echo ""
echo "Creating user with:"
echo "  Email: $EMAIL"
echo "  Name: $FULLNAME"
echo "  Role: $ROLE"
echo "  Org ID: $ORG_ID"
echo "  Temp Password: ********"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Load environment variables
source .env

echo ""
echo "Step 1/2: Creating user in AWS Cognito..."

# Create user in Cognito
aws cognito-idp admin-create-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS \
    --region "$COGNITO_REGION"

if [ $? -eq 0 ]; then
    echo "✓ User created in Cognito"
else
    echo "✗ Failed to create user in Cognito"
    exit 1
fi

echo ""
echo "Step 2/2: Adding user to database..."

# Add user to database
docker-compose exec -T db psql -U vbp_user -d vbp_database <<EOF
INSERT INTO users (organization_id, email, full_name, role, active_flag, login_enabled) 
VALUES ($ORG_ID, '$EMAIL', '$FULLNAME', '$ROLE', true, true)
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    active_flag = EXCLUDED.active_flag,
    login_enabled = EXCLUDED.login_enabled;
EOF

if [ $? -eq 0 ]; then
    echo "✓ User added to database"
else
    echo "✗ Failed to add user to database"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ User created successfully!"
echo "=========================================="
echo ""
echo "Login credentials:"
echo "  Email: $EMAIL"
echo "  Temporary Password: $TEMP_PASSWORD"
echo ""
echo "User will be required to change password on first login."
echo ""
