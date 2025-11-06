# AWS Deployment Guide - MyMasjidApp

Complete guide to deploy MyMasjidApp on AWS EC2 and make it live online.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Launch EC2 Instance](#launch-ec2-instance)
4. [Configure Security Groups](#configure-security-groups)
5. [Deploy Application](#deploy-application)
6. [Domain & Route 53 Setup](#domain--route-53-setup)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Production Optimization](#production-optimization)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Cost Estimation](#cost-estimation)

---

## Prerequisites

### Required Accounts
- ✅ AWS Account (Free tier eligible)
- ✅ Domain name (optional but recommended)
- ✅ SSH client (PuTTY for Windows, Terminal for Mac/Linux)

### AWS Free Tier
- **750 hours/month** of t2.micro or t3.micro EC2 instances
- **5GB** of S3 storage
- **20GB** of EBS storage
- **15GB** of data transfer out

---

## AWS Account Setup

### Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Complete registration process
4. Verify email and phone number

### Step 2: Configure AWS CLI (Optional but Recommended)

```bash
# Install AWS CLI
# Windows (using Chocolatey)
choco install awscli

# Mac
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

**Get AWS Access Keys:**
1. Go to AWS Console → IAM → Users
2. Click your username → Security credentials
3. Create access key → Download CSV file

---

## Launch EC2 Instance

### Option A: Using AWS Console (GUI)

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to EC2 service

2. **Launch Instance**
   - Click "Launch Instance"
   - Name: `MyMasjidApp-Production`

3. **Choose AMI (Amazon Machine Image)**
   - Select **Ubuntu Server 22.04 LTS** (Free tier eligible)
   - Architecture: 64-bit (x86)

4. **Choose Instance Type**
   - **t2.micro** or **t3.micro** (Free tier eligible)
   - 1 vCPU, 1GB RAM (sufficient for small deployments)
   - For production with more users: **t3.small** (2GB RAM) or **t3.medium** (4GB RAM)

5. **Create or Select Key Pair**
   - Click "Create new key pair"
   - Name: `masjid-app-key`
   - Key pair type: RSA
   - Private key file format: `.pem` (for Linux/Mac) or `.ppk` (for Windows PuTTY)
   - Click "Create key pair"
   - **IMPORTANT**: Download and save the key file securely!

6. **Configure Network Settings**
   - VPC: Default VPC (or create new)
   - Subnet: Any public subnet
   - Auto-assign Public IP: Enable
   - Security Group: Create new (we'll configure in next step)

7. **Configure Storage**
   - Size: **20GB** (Free tier includes 30GB)
   - Volume type: gp3 (SSD)
   - Delete on termination: Unchecked (to keep data)

8. **Review and Launch**
   - Review all settings
   - Click "Launch Instance"

9. **View Instance**
   - Click "View Instances"
   - Wait for status to be "Running" (2-3 minutes)
   - Note the **Public IPv4 address** (e.g., `54.123.45.67`)

### Option B: Using AWS CLI (Command Line)

```bash
# Create key pair
aws ec2 create-key-pair --key-name masjid-app-key --query 'KeyMaterial' --output text > masjid-app-key.pem
chmod 400 masjid-app-key.pem

# Create security group (we'll configure rules in next section)
aws ec2 create-security-group --group-name masjid-app-sg --description "MyMasjidApp Security Group"

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name masjid-app-key \
  --security-groups masjid-app-sg \
  --user-data file://aws-setup.sh \
  --count 1

# Get instance IP
aws ec2 describe-instances --query 'Reservations[*].Instances[*].PublicIpAddress' --output text
```

### Step 3: Connect to Your Instance

**For Linux/Mac:**
```bash
# Change key permissions
chmod 400 masjid-app-key.pem

# Connect via SSH
ssh -i masjid-app-key.pem ubuntu@YOUR_PUBLIC_IP

# Example:
ssh -i masjid-app-key.pem ubuntu@54.123.45.67
```

**For Windows (PuTTY):**
1. Download [PuTTY](https://www.putty.org/)
2. Convert `.pem` to `.ppk` using PuTTYgen
3. Connect using PuTTY with the `.ppk` file

**For Windows (WSL/Git Bash):**
```bash
# Same as Linux/Mac
chmod 400 masjid-app-key.pem
ssh -i masjid-app-key.pem ubuntu@YOUR_PUBLIC_IP
```

---

## Configure Security Groups

Security groups act as a firewall for your EC2 instance.

### Step 1: Configure Security Group Rules

1. **In AWS Console:**
   - Go to EC2 → Security Groups
   - Select your security group
   - Click "Edit inbound rules"

2. **Add Rules:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | My IP (or 0.0.0.0/0 for any) | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 5000 | 127.0.0.1/32 | Backend API (internal only) |
| Custom TCP | TCP | 3000 | 127.0.0.1/32 | Frontend (internal only) |

**For production, restrict SSH to your IP only:**
- Click "Add rule"
- Type: SSH
- Source: My IP (AWS will auto-detect) or specific IP

### Step 2: Verify Security Group

```bash
# From AWS CLI
aws ec2 describe-security-groups --group-names masjid-app-sg
```

---

## Deploy Application

### Step 1: Run Initial Server Setup

Connect to your EC2 instance and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget nano ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for docker group to take effect
exit
# Then reconnect: ssh -i masjid-app-key.pem ubuntu@YOUR_IP

# Verify installations
docker --version
docker-compose --version
```

### Step 2: Clone/Upload Application

**Option A: Using Git (Recommended)**
```bash
# Clone from GitHub/GitLab
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp
```

**Option B: Upload Files via SCP**
```bash
# From your local machine
scp -i masjid-app-key.pem -r /path/to/MyMasjidApp ubuntu@YOUR_IP:~/
```

**Option C: Using AWS CodeCommit/CodeDeploy**
```bash
# Set up AWS CodeDeploy (advanced option)
```

### Step 3: Configure Environment

```bash
# Navigate to project
cd ~/MyMasjidApp

# Copy environment templates
cp backend/env.production backend/.env
cp env.production .env

# Edit backend environment
nano backend/.env
```

**Configure `backend/.env`:**
```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=masjid_user
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=GENERATE_LONG_RANDOM_STRING_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration - Replace with your domain
FRONTEND_URL=https://yourdomain.com

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Masjid App

# Security
BCRYPT_ROUNDS=12
```

**Generate secure passwords:**
```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32
```

**Configure root `.env`:**
```bash
nano .env
```

```env
DOMAIN=yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Step 4: Update Nginx Configuration

```bash
nano nginx/nginx.conf
```

Replace `yourdomain.com` with your actual domain (or use EC2 public IP temporarily):
- Line 50: `server_name yourdomain.com www.yourdomain.com;`
- Line 57: `server_name yourdomain.com www.yourdomain.com;`

**For initial testing, you can use:**
```nginx
server_name _;  # Accepts any domain
```

### Step 5: Deploy Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or manually:**
```bash
# Create directories
mkdir -p nginx/ssl nginx/logs uploads

# Build and start
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services
sleep 30

# Run migrations
docker-compose exec backend npm run migrate

# Check status
docker-compose ps
```

### Step 6: Verify Deployment

```bash
# Check containers
docker-compose ps

# Check logs
docker-compose logs

# Test locally on server
curl http://localhost
curl http://localhost/api/health
```

**Test from your browser:**
- Visit: `http://YOUR_EC2_PUBLIC_IP`
- You should see your application!

---

## Domain & Route 53 Setup

### Step 1: Get Your EC2 Public IP

```bash
# From EC2 instance
curl ifconfig.me

# Or from AWS Console
# EC2 → Instances → Your instance → Public IPv4 address
```

### Step 2: Configure Route 53 (If Using AWS Route 53)

1. **Go to Route 53** in AWS Console
2. **Create Hosted Zone**
   - Domain name: `yourdomain.com`
   - Type: Public hosted zone
3. **Create A Record**
   - Name: `@` (root domain)
   - Type: A
   - Value: Your EC2 Public IP
   - TTL: 300
4. **Create A Record for www**
   - Name: `www`
   - Type: A
   - Value: Your EC2 Public IP
   - TTL: 300
5. **Update Name Servers**
   - Copy the 4 name servers from Route 53
   - Go to your domain registrar
   - Update name servers

### Step 3: Configure Domain with Other Registrars

If not using Route 53:

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Create A Record**
   - Host: `@` or blank
   - Points to: Your EC2 Public IP
   - TTL: 3600
3. **Create A Record for www**
   - Host: `www`
   - Points to: Your EC2 Public IP
   - TTL: 3600

4. **Wait for DNS propagation** (5 minutes to 48 hours)
   - Check: `nslookup yourdomain.com`
   - Online: https://dnschecker.org

### Step 4: Update Application Configuration

```bash
# Update nginx config
nano nginx/nginx.conf
# Replace 'yourdomain.com' with actual domain

# Update .env
nano .env
# Update DOMAIN and VITE_API_BASE_URL

# Update backend/.env
nano backend/.env
# Update FRONTEND_URL

# Restart services
docker-compose restart
```

---

## SSL Certificate Setup

### Step 1: Install Certbot

```bash
# Update system
sudo apt update

# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx container temporarily
docker-compose stop nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email (optional)
```

### Step 3: Copy Certificates

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Set permissions
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl
```

### Step 4: Configure Nginx for SSL

Ensure `nginx/nginx.conf` has correct SSL paths:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

Update domain name in nginx.conf:
```bash
nano nginx/nginx.conf
# Replace 'yourdomain.com' with actual domain
```

### Step 5: Restart Services

```bash
# Restart nginx
docker-compose restart nginx

# Test HTTPS
curl https://yourdomain.com
```

### Step 6: Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Create renewal script
sudo nano /etc/cron.d/certbot-renewal
```

Add:
```bash
0 12 * * * root certbot renew --quiet --deploy-hook "cd /home/ubuntu/MyMasjidApp && docker-compose restart nginx"
```

---

## Production Optimization

### Step 1: Configure Elastic IP (Static IP)

EC2 instances get new IPs when restarted. Use Elastic IP for static IP:

1. **Allocate Elastic IP**
   - EC2 → Elastic IPs → Allocate Elastic IP address
   - Click "Allocate"

2. **Associate with Instance**
   - Select Elastic IP
   - Actions → Associate Elastic IP address
   - Select your instance
   - Click "Associate"

3. **Update DNS Records**
   - Update A records to point to Elastic IP

### Step 2: Set Up Auto-Scaling (Optional)

For high availability and auto-scaling:
```bash
# Create Launch Template
# Configure Auto Scaling Group
# Set up Application Load Balancer
```

### Step 3: Use AWS RDS for Database (Production Recommended)

Instead of container MySQL, use AWS RDS:

1. **Create RDS Instance**
   - Go to RDS → Create database
   - Engine: MySQL 8.0
   - Template: Free tier
   - DB instance identifier: `masjid-app-db`
   - Master username: `admin`
   - Master password: (strong password)
   - DB instance class: db.t2.micro (free tier)

2. **Update Security Group**
   - Allow EC2 security group to access RDS

3. **Update Application**
   ```bash
   # Update backend/.env
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_PORT=3306
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   ```

4. **Remove MySQL from docker-compose.yml**
   ```yaml
   # Comment out or remove mysql service
   ```

### Step 4: Set Up CloudWatch Monitoring

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### Step 5: Configure Backups

```bash
# Set up automated backups
chmod +x scripts/backup-db.sh

# Create cron job
crontab -e
# Add: 0 2 * * * cd /home/ubuntu/MyMasjidApp && ./scripts/backup-db.sh

# Upload backups to S3
aws s3 sync backups/ s3://your-bucket-name/backups/
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Check disk space
df -h
```

### Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update application
git pull origin main
docker-compose up -d --build

# Check SSL certificate
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

### Monitoring Commands

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Check resource usage
docker stats

# System monitoring
htop
```

---

## Cost Estimation

### Free Tier (First 12 Months)
- **EC2 t2.micro**: $0 (750 hours/month)
- **EBS Storage**: $0 (30GB)
- **Data Transfer Out**: $0 (15GB)
- **Total**: **$0/month**

### After Free Tier (Small Deployment)
- **EC2 t2.micro**: ~$8-10/month
- **EBS Storage (20GB)**: ~$2/month
- **Data Transfer (10GB)**: ~$0.90/month
- **Total**: **~$10-13/month**

### With RDS (Production)
- **EC2 t2.micro**: ~$8/month
- **RDS db.t2.micro**: ~$15/month
- **EBS Storage**: ~$2/month
- **Total**: **~$25/month**

---

## Troubleshooting

### Issue: Can't connect via SSH

**Solution:**
- Check security group allows SSH from your IP
- Verify key pair permissions: `chmod 400 masjid-app-key.pem`
- Check instance is running in AWS Console

### Issue: Website not accessible

**Solution:**
```bash
# Check security group allows HTTP/HTTPS
# Check containers are running
docker-compose ps

# Check nginx logs
docker-compose logs nginx

# Test locally
curl http://localhost
```

### Issue: SSL certificate errors

**Solution:**
```bash
# Verify domain DNS
nslookup yourdomain.com

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Renew certificate
sudo certbot renew
```

### Issue: Out of disk space

**Solution:**
```bash
# Clean Docker
docker system prune -a

# Check disk usage
df -h
du -sh * | sort -h
```

---

## Quick Reference Commands

```bash
# Connect to EC2
ssh -i masjid-app-key.pem ubuntu@YOUR_IP

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after changes
docker-compose up -d --build

# Create backup
./scripts/backup-db.sh

# Monitor system
./scripts/monitor.sh
```

---

## Next Steps

1. ✅ Application deployed and running
2. ✅ Domain configured and pointing to server
3. ✅ SSL certificate installed
4. ✅ Auto-renewal configured
5. ⬜ Set up monitoring alerts
6. ⬜ Configure automated backups to S3
7. ⬜ Set up CloudWatch dashboards
8. ⬜ Consider migrating to RDS for production

---

**Your MyMasjidApp is now live on AWS! 🎉**

For additional help:
- AWS Documentation: https://docs.aws.amazon.com/
- EC2 User Guide: https://docs.aws.amazon.com/ec2/
- AWS Support: https://aws.amazon.com/support/

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0

