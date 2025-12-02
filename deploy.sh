#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ECar Fleet Management System Deployment Script ===${NC}"

# 1. Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (sudo ./deploy.sh)${NC}"
  exit 1
fi

# 2. Update System
echo -e "${GREEN}[1/6] Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y curl git unzip ufw nginx certbot python3-certbot-nginx

# 3. Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}[2/6] Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}[2/6] Docker already installed.${NC}"
fi

# 4. Configuration
echo -e "${GREEN}[3/6] Configuration${NC}"
if [ ! -f .env ]; then
    echo "Creating .env file..."
    read -p "Enter Domain Name (e.g., ecar.albena.bg): " DOMAIN_NAME
    read -p "Enter Database Password: " DB_PASSWORD
    read -p "Enter Redis Password: " REDIS_PASSWORD
    read -p "Enter JWT Secret (random string): " JWT_SECRET
    read -p "Enter SMTP Password (for ecar@albena.bg): " SMTP_PASSWORD

    cat > .env << EOL
DB_NAME=ecar
DB_USER=ecar_prod
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET
DOMAIN_NAME=$DOMAIN_NAME
SMTP_HOST=mail.albena.bg
SMTP_PORT=26
SMTP_SECURE=false
SMTP_USER=ecar@albena.bg
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=ecar@albena.bg
EOL
    echo ".env file created."
else
    echo ".env file exists. Skipping configuration."
    source .env
fi

# 5. Start Docker Containers
echo -e "${GREEN}[4/6] Starting Application Containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 6. Configure Nginx
echo -e "${GREEN}[5/6] Configuring Nginx Reverse Proxy...${NC}"
cat > /etc/nginx/sites-available/ecar << EOL
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

ln -sf /etc/nginx/sites-available/ecar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. SSL Setup
echo -e "${GREEN}[6/6] Setting up SSL with Let's Encrypt...${NC}"
read -p "Do you want to setup SSL now? (y/n): " SETUP_SSL
if [[ $SETUP_SSL =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN_NAME
fi

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Frontend: https://$DOMAIN_NAME"
echo -e "Backend API: https://$DOMAIN_NAME/api"
