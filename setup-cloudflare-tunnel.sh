#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}☁️  Cloudflare Tunnel Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Проверка наличия cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}cloudflared not found. Installing...${NC}"

    # Определяем ОС
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install cloudflare/cloudflare/cloudflared
    else
        echo -e "${RED}Unsupported OS. Please install cloudflared manually.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ cloudflared installed${NC}"
else
    echo -e "${GREEN}✅ cloudflared is already installed${NC}"
fi
echo ""

# Запрос домена у пользователя
echo -e "${YELLOW}📝 Enter your domain name (e.g., focusloop.com):${NC}"
read -p "Domain: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain cannot be empty${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Enter tunnel name (default: focusloop-goal-tracker):${NC}"
read -p "Tunnel name: " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-focusloop-goal-tracker}

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Setup Steps:${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Шаг 1: Логин в Cloudflare
echo -e "${YELLOW}📋 Step 1: Login to Cloudflare${NC}"
echo "This will open a browser window. Please login and select your domain."
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cloudflare login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Cloudflare${NC}"
echo ""

# Шаг 2: Создание туннеля
echo -e "${YELLOW}📋 Step 2: Creating tunnel '${TUNNEL_NAME}'${NC}"
cloudflared tunnel create $TUNNEL_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create tunnel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tunnel created${NC}"
echo ""

# Получаем Tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"
echo ""

# Шаг 3: Создание конфигурации
echo -e "${YELLOW}📋 Step 3: Creating tunnel configuration${NC}"

CREDS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
CONFIG_FILE="$HOME/.cloudflared/config.yml"

cat > $CONFIG_FILE << EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDS_FILE

ingress:
  # Frontend
  - hostname: $DOMAIN
    service: http://localhost:80

  # API subdomain (optional, if you want separate API domain)
  # - hostname: api.$DOMAIN
  #   service: http://localhost:80

  # Catch-all rule (required)
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Configuration created at $CONFIG_FILE${NC}"
echo ""

# Шаг 4: Настройка DNS
echo -e "${YELLOW}📋 Step 4: Setting up DNS${NC}"
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to set up DNS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DNS configured${NC}"
echo ""

# Шаг 5: Создание systemd service
echo -e "${YELLOW}📋 Step 5: Creating systemd service${NC}"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo tee /etc/systemd/system/cloudflared.service > /dev/null << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/cloudflared tunnel --config $CONFIG_FILE run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable cloudflared
    sudo systemctl start cloudflared

    echo -e "${GREEN}✅ Systemd service created and started${NC}"
    echo ""
    echo "Check status: sudo systemctl status cloudflared"
    echo "View logs: sudo journalctl -u cloudflared -f"
else
    echo -e "${YELLOW}⚠️  Not Linux, skipping systemd service creation${NC}"
    echo "To run tunnel manually:"
    echo "  cloudflared tunnel run $TUNNEL_NAME"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Cloudflare Tunnel Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📝 Configuration Summary:"
echo "  Domain: https://$DOMAIN"
echo "  Tunnel Name: $TUNNEL_NAME"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Config File: $CONFIG_FILE"
echo ""
echo "📝 Next Steps:"
echo "1. Update Telegram bot domain in BotFather:"
echo "   /setdomain → @focusloop_goal_bot → $DOMAIN"
echo ""
echo "2. Update Mini App URL in BotFather:"
echo "   /myapps → select your app → Edit → https://$DOMAIN"
echo ""
echo "3. Test your application:"
echo "   https://$DOMAIN"
echo ""
echo "4. Monitor tunnel status:"
echo "   cloudflared tunnel info $TUNNEL_NAME"
echo ""
