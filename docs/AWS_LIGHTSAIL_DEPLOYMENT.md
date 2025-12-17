# AWS Lightsail Deployment Guide

This document captures all decisions, commands, and setup steps for deploying the Astro application to AWS Lightsail with CI/CD via CodePipeline.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Application Deployment](#application-deployment)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Useful Commands](#useful-commands)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   GitHub    │────▶│ CodePipeline │────▶│    CodeBuild    │────▶│  Lightsail Instance │
│  (main)     │     │              │     │  (Build + SSH)  │     │   (Node.js + Nginx) │
└─────────────┘     └──────────────┘     └─────────────────┘     └─────────────────────┘
```

### Key Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| **Hosting** | Lightsail Instance (not Container) | Container Service had quota issues; Instance gives more control |
| **Instance Size** | Small ($12/mo) | 2 vCPU, 2GB RAM, 60GB SSD - good for production |
| **Runtime** | Node.js directly (not Docker) | Simpler setup, faster deployments |
| **Reverse Proxy** | Nginx | Route port 80 → 4321, SSL termination ready |
| **Process Manager** | PM2 | Auto-restart on crash, boot persistence |
| **CI/CD** | CodePipeline + CodeBuild | Native AWS, GitHub integration |
| **Secrets** | AWS Secrets Manager | SSH key storage |
| **Config** | Dynamic IP fetch | No hardcoded IPs, fetched from Lightsail API |

---

## Prerequisites

- AWS CLI configured with profile `slashexperts`
- IAM user with `AdministratorAccess` (or specific permissions below)
- GitHub repository: `slashexperts/astro-on-koyeb`

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect": "Allow", "Action": "lightsail:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "codepipeline:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "codebuild:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "secretsmanager:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "iam:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "s3:*", "Resource": "*"},
    {"Effect": "Allow", "Action": "codestar-connections:*", "Resource": "*"}
  ]
}
```

---

## Infrastructure Setup

### Step 1: Create SSH Key Pair

```bash
# Create key pair for Lightsail instance
aws --profile slashexperts lightsail create-key-pair \
  --key-pair-name slashexperts-key2 \
  --region us-east-1 > /tmp/keypair.json

# Extract and save private key
cat /tmp/keypair.json | jq -r '.privateKeyBase64' > ~/.ssh/slashexperts-lightsail2.pem
chmod 600 ~/.ssh/slashexperts-lightsail2.pem
```

### Step 2: Create Lightsail Instance

```bash
# Create instance with Node.js blueprint
aws --profile slashexperts lightsail create-instances \
  --instance-names astro-example-company-website \
  --availability-zone us-east-1a \
  --blueprint-id nodejs \
  --bundle-id small_3_0 \
  --key-pair-name slashexperts-key2 \
  --tags key=Project,value=SlashExperts key=Environment,value=Production \
  --region us-east-1

# Wait for instance to be running
aws --profile slashexperts lightsail get-instance \
  --instance-name astro-example-company-website \
  --region us-east-1 \
  --query 'instance.state.name'
```

### Step 3: Allocate and Attach Static IP

```bash
# Allocate static IP
aws --profile slashexperts lightsail allocate-static-ip \
  --static-ip-name slashexperts-ip \
  --region us-east-1

# Attach to instance
aws --profile slashexperts lightsail attach-static-ip \
  --static-ip-name slashexperts-ip \
  --instance-name astro-example-company-website \
  --region us-east-1

# Get the IP address
aws --profile slashexperts lightsail get-static-ip \
  --static-ip-name slashexperts-ip \
  --region us-east-1 \
  --query 'staticIp.ipAddress' --output text
```

### Step 4: Open Firewall Ports

```bash
# Open HTTP (80)
aws --profile slashexperts lightsail open-instance-public-ports \
  --instance-name astro-example-company-website \
  --port-info fromPort=80,toPort=80,protocol=tcp \
  --region us-east-1

# Open HTTPS (443)
aws --profile slashexperts lightsail open-instance-public-ports \
  --instance-name astro-example-company-website \
  --port-info fromPort=443,toPort=443,protocol=tcp \
  --region us-east-1

# Open app port (4321) - optional, for direct access
aws --profile slashexperts lightsail open-instance-public-ports \
  --instance-name astro-example-company-website \
  --port-info fromPort=4321,toPort=4321,protocol=tcp \
  --region us-east-1
```

---

## Application Deployment

### Step 5: Deploy Application to Instance

```bash
# Get static IP
STATIC_IP=$(aws --profile slashexperts lightsail get-static-ip \
  --static-ip-name slashexperts-ip \
  --region us-east-1 \
  --query 'staticIp.ipAddress' --output text)

# Create deployment package
cd /path/to/astro-on-koyeb
tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf /tmp/astro-app.tar.gz .

# Copy to server
scp -i ~/.ssh/slashexperts-lightsail2.pem /tmp/astro-app.tar.gz bitnami@$STATIC_IP:/tmp/

# SSH and deploy
ssh -i ~/.ssh/slashexperts-lightsail2.pem bitnami@$STATIC_IP << 'EOF'
mkdir -p ~/app
cd ~/app
tar -xzf /tmp/astro-app.tar.gz
npm ci
npm run build
EOF
```

### Step 6: Setup PM2 Process Manager

```bash
ssh -i ~/.ssh/slashexperts-lightsail2.pem bitnami@$STATIC_IP << 'EOF'
# Install PM2
sudo npm install -g pm2

# Start application
cd ~/app
pm2 start dist/server/entry.mjs --name "astro-app"

# Save PM2 config and setup startup
pm2 save
sudo env PATH=$PATH:/opt/bitnami/node/bin pm2 startup systemd -u bitnami --hp /home/bitnami
EOF
```

### Step 7: Setup Nginx Reverse Proxy

```bash
ssh -i ~/.ssh/slashexperts-lightsail2.pem bitnami@$STATIC_IP << 'EOF'
# Install nginx
sudo apt-get update -qq
sudo apt-get install -y nginx

# Stop Bitnami Apache (if running)
sudo /opt/bitnami/ctlscript.sh stop apache 2>/dev/null || true

# Create nginx config
sudo tee /etc/nginx/sites-available/astro-app > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/astro-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start nginx
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx
EOF
```

---

## CI/CD Pipeline Setup

### Step 8: Store SSH Key in Secrets Manager

```bash
aws --profile slashexperts secretsmanager create-secret \
  --name "lightsail/astro-app-ssh-key" \
  --description "SSH private key for deploying to Lightsail instance" \
  --secret-string "$(cat ~/.ssh/slashexperts-lightsail2.pem)" \
  --region us-east-1
```

### Step 9: Create IAM Role for CodeBuild

```bash
# Create role
aws --profile slashexperts iam create-role \
  --role-name CodeBuildAstroAppRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "codebuild.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach main policy
aws --profile slashexperts iam put-role-policy \
  --role-name CodeBuildAstroAppRole \
  --policy-name CodeBuildAstroAppPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject"],
        "Resource": "arn:aws:s3:::*"
      },
      {
        "Effect": "Allow",
        "Action": ["secretsmanager:GetSecretValue"],
        "Resource": "arn:aws:secretsmanager:us-east-1:017820669040:secret:lightsail/astro-app-ssh-key-*"
      },
      {
        "Effect": "Allow",
        "Action": ["codebuild:CreateReportGroup", "codebuild:CreateReport", "codebuild:UpdateReport", "codebuild:BatchPutTestCases"],
        "Resource": "*"
      }
    ]
  }'

# Add Lightsail permission (for dynamic IP fetch)
aws --profile slashexperts iam put-role-policy \
  --role-name CodeBuildAstroAppRole \
  --policy-name CodeBuildLightsailPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["lightsail:GetInstance", "lightsail:GetStaticIp"],
      "Resource": "*"
    }]
  }'
```

### Step 10: Create S3 Bucket for Artifacts

```bash
aws --profile slashexperts s3 mb s3://codepipeline-astro-app-017820669040 --region us-east-1
```

### Step 11: Create CodeBuild Project

```bash
aws --profile slashexperts codebuild create-project \
  --name "astro-app-build" \
  --description "Build and deploy Astro app to Lightsail" \
  --source '{
    "type": "CODEPIPELINE",
    "buildspec": "buildspec.yml"
  }' \
  --artifacts '{"type": "CODEPIPELINE"}' \
  --environment '{
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0",
    "computeType": "BUILD_GENERAL1_SMALL"
  }' \
  --service-role "arn:aws:iam::017820669040:role/CodeBuildAstroAppRole" \
  --region us-east-1
```

### Step 12: Create CodeStar Connection to GitHub

```bash
aws --profile slashexperts codestar-connections create-connection \
  --provider-type GitHub \
  --connection-name "github-slashexperts" \
  --region us-east-1
```

**⚠️ MANUAL STEP REQUIRED:**
1. Go to AWS Console → Developer Tools → Settings → Connections
2. Find `github-slashexperts` (status: Pending)
3. Click "Update pending connection"
4. Authorize AWS to access your GitHub account
5. Select the repository

### Step 13: Create IAM Role for CodePipeline

```bash
# Create role
aws --profile slashexperts iam create-role \
  --role-name CodePipelineAstroAppRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "codepipeline.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws --profile slashexperts iam put-role-policy \
  --role-name CodePipelineAstroAppRole \
  --policy-name CodePipelineAstroAppPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:GetBucketVersioning", "s3:PutObject"],
        "Resource": ["arn:aws:s3:::codepipeline-astro-app-017820669040", "arn:aws:s3:::codepipeline-astro-app-017820669040/*"]
      },
      {
        "Effect": "Allow",
        "Action": ["codebuild:BatchGetBuilds", "codebuild:StartBuild"],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": ["codestar-connections:UseConnection"],
        "Resource": "arn:aws:codestar-connections:us-east-1:017820669040:connection/*"
      }
    ]
  }'
```

### Step 14: Create CodePipeline

```bash
# Get connection ARN
CONNECTION_ARN=$(aws --profile slashexperts codestar-connections list-connections \
  --region us-east-1 \
  --query 'Connections[?ConnectionName==`github-slashexperts`].ConnectionArn' \
  --output text)

# Create pipeline
aws --profile slashexperts codepipeline create-pipeline \
  --pipeline "{
    \"name\": \"astro-app-pipeline\",
    \"roleArn\": \"arn:aws:iam::017820669040:role/CodePipelineAstroAppRole\",
    \"artifactStore\": {
      \"type\": \"S3\",
      \"location\": \"codepipeline-astro-app-017820669040\"
    },
    \"stages\": [
      {
        \"name\": \"Source\",
        \"actions\": [{
          \"name\": \"GitHub_Source\",
          \"actionTypeId\": {
            \"category\": \"Source\",
            \"owner\": \"AWS\",
            \"provider\": \"CodeStarSourceConnection\",
            \"version\": \"1\"
          },
          \"configuration\": {
            \"ConnectionArn\": \"$CONNECTION_ARN\",
            \"FullRepositoryId\": \"slashexperts/astro-on-koyeb\",
            \"BranchName\": \"main\",
            \"OutputArtifactFormat\": \"CODE_ZIP\"
          },
          \"outputArtifacts\": [{\"name\": \"SourceOutput\"}],
          \"runOrder\": 1
        }]
      },
      {
        \"name\": \"Build_and_Deploy\",
        \"actions\": [{
          \"name\": \"Build\",
          \"actionTypeId\": {
            \"category\": \"Build\",
            \"owner\": \"AWS\",
            \"provider\": \"CodeBuild\",
            \"version\": \"1\"
          },
          \"configuration\": {\"ProjectName\": \"astro-app-build\"},
          \"inputArtifacts\": [{\"name\": \"SourceOutput\"}],
          \"outputArtifacts\": [{\"name\": \"BuildOutput\"}],
          \"runOrder\": 1
        }]
      }
    ]
  }" \
  --region us-east-1
```

---

## Useful Commands

### SSH into Instance

```bash
STATIC_IP=$(aws --profile slashexperts lightsail get-static-ip \
  --static-ip-name slashexperts-ip --region us-east-1 \
  --query 'staticIp.ipAddress' --output text)

ssh -i ~/.ssh/slashexperts-lightsail2.pem bitnami@$STATIC_IP
```

### Check Application Status

```bash
# On server
pm2 status
pm2 logs astro-app
```

### Manual Deployment

```bash
ssh -i ~/.ssh/slashexperts-lightsail2.pem bitnami@$STATIC_IP << 'EOF'
cd ~/app
git pull origin main  # If using git
npm ci
npm run build
pm2 restart astro-app
EOF
```

### Check Pipeline Status

```bash
aws --profile slashexperts codepipeline get-pipeline-state \
  --name astro-app-pipeline \
  --region us-east-1 \
  --query 'stageStates[*].{Stage:stageName,Status:latestExecution.status}' \
  --output table
```

### View CodeBuild Logs

```bash
BUILD_ID=$(aws --profile slashexperts codebuild list-builds-for-project \
  --project-name astro-app-build --region us-east-1 \
  --query 'ids[0]' --output text)

aws --profile slashexperts logs get-log-events \
  --log-group-name "/aws/codebuild/astro-app-build" \
  --log-stream-name "${BUILD_ID#*/}" \
  --region us-east-1 \
  --query 'events[*].message' --output text
```

### Restart Instance

```bash
aws --profile slashexperts lightsail reboot-instance \
  --instance-name astro-example-company-website \
  --region us-east-1
```

---

## Troubleshooting

### Pipeline Fails at Source Stage

- Check GitHub connection is active in AWS Console
- Verify repository name and branch are correct

### Pipeline Fails at Build Stage

- Check CodeBuild logs for errors
- Verify IAM permissions for CodeBuild role
- Check buildspec.yml syntax

### SSH Connection Fails

- Verify security group/firewall allows port 22
- Check SSH key permissions: `chmod 600 ~/.ssh/slashexperts-lightsail2.pem`
- Verify correct username: `bitnami` for Bitnami images

### Site Not Accessible on Port 80

- Check nginx is running: `sudo systemctl status nginx`
- Check nginx config: `sudo nginx -t`
- Verify Bitnami Apache is stopped

### PM2 Process Not Running

- Check PM2 status: `pm2 status`
- View logs: `pm2 logs astro-app`
- Restart: `pm2 restart astro-app`

---

## Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| Lightsail Instance (small) | $12.00 |
| Static IP (attached) | $0.00 |
| Data Transfer (first 3TB) | $0.00 |
| CodePipeline | $1.00/pipeline |
| CodeBuild | ~$0.50 (first 100 min free) |
| Secrets Manager | ~$0.40 |
| **Total** | **~$14/month** |

---

## Resources Created

| Resource | Name/ID |
|----------|---------|
| Lightsail Instance | `astro-example-company-website` |
| Static IP | `slashexperts-ip` |
| SSH Key Pair | `slashexperts-key2` |
| CodePipeline | `astro-app-pipeline` |
| CodeBuild Project | `astro-app-build` |
| S3 Bucket | `codepipeline-astro-app-017820669040` |
| IAM Role (CodeBuild) | `CodeBuildAstroAppRole` |
| IAM Role (CodePipeline) | `CodePipelineAstroAppRole` |
| Secret | `lightsail/astro-app-ssh-key` |
| GitHub Connection | `github-slashexperts` |

---

*Generated on: December 17, 2025*

