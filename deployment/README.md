# AI Girls Deployment Guide

Deployment configurations for Ubuntu VPS (Hetzner).

## Prerequisites

- Ubuntu 20.04+ VPS
- Domain name pointed to VPS IP
- Root or sudo access

## Installation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Dependencies

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

### 3. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/ai-girls.git
cd ai-girls
sudo chown -R $USER:$USER .
```

### 4. Build Backend

```bash
cd backend
npm install
npm run build
```

### 5. Build Frontend

```bash
cd ../frontend
npm install
npm run build
```

### 6. Export Godot (from local machine)

On your local machine with Godot Editor installed:

1. Open the project in Godot 4.5
2. Go to **Project → Export**
3. Select **Web (HTML5)** preset
4. Click **Export Project**
5. Export to `godot-web-build/`

Upload to VPS:

```bash
# From local machine
scp -r godot-web-build/* user@your-vps:/opt/ai-girls/godot-web-build/
```

### 7. Configure systemd Service

```bash
# Edit the service file with your actual Gemini API key
sudo nano deployment/systemd/ai-girls.service

# Copy to systemd directory
sudo cp deployment/systemd/ai-girls.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable ai-girls
sudo systemctl start ai-girls

# Check status
sudo systemctl status ai-girls
```

### 8. Configure Nginx

```bash
# Edit the Nginx config with your domain name
sudo nano deployment/nginx/ai-girls.conf

# Copy to Nginx sites-available
sudo cp deployment/nginx/ai-girls.conf /etc/nginx/sites-available/

# Enable site
sudo ln -s /etc/nginx/sites-available/ai-girls.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 9. Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-domain.com

# Certbot will automatically update the Nginx config
```

### 10. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Verify Deployment

1. Check backend service:
   ```bash
   sudo systemctl status ai-girls
   sudo journalctl -u ai-girls -f
   ```

2. Check Nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. Test endpoints:
   ```bash
   curl https://your-domain.com/health
   ```

4. Open in browser:
   ```
   https://your-domain.com
   ```

## Updating

### Update Code

```bash
cd /opt/ai-girls
git pull
```

### Rebuild Backend

```bash
cd backend
npm install
npm run build
sudo systemctl restart ai-girls
```

### Rebuild Frontend

```bash
cd ../frontend
npm install
npm run build
```

### Re-export Godot

```bash
# Upload new build from local machine
scp -r godot-web-build/* user@your-vps:/opt/ai-girls/godot-web-build/
```

## Monitoring

### View Logs

```bash
# Backend logs
sudo journalctl -u ai-girls -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart ai-girls

# Reload Nginx (without downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Backend not starting

```bash
# Check logs
sudo journalctl -u ai-girls -n 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Check environment variables
sudo systemctl show ai-girls --property=Environment
```

### WebSocket connection issues

- Check firewall rules
- Verify Nginx WebSocket proxy configuration
- Check browser console for errors
- Verify `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers

### Godot not loading

- Check if files exist in `/opt/ai-girls/godot-web-build/`
- Verify MIME types in Nginx config
- Check browser console for errors
- Ensure COOP/COEP headers are set correctly

### SSL certificate renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

## Security

### Environment Variables

Never commit `.env` files to Git. Always set them directly in the systemd service file or use a secrets manager.

### Backup

```bash
# Backup database (if using one in the future)
# For now, conversation history is in-memory

# Backup configuration
sudo tar -czf ai-girls-backup-$(date +%Y%m%d).tar.gz /opt/ai-girls/deployment /opt/ai-girls/backend/.env
```

## Performance

### Enable Gzip Compression

Add to Nginx config:

```nginx
gzip on;
gzip_types application/wasm application/javascript text/css;
gzip_min_length 1000;
```

### Monitor Resource Usage

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Check backend memory usage
ps aux | grep node
```

## Cost Optimization

- **Hetzner VPS (CX21)**: €5-10/month
- **Domain**: €10/year
- **Gemini API**: Free tier (60 req/min) or pay-as-you-go

Total: ~€15-20/month

## Support

For issues, check:
1. Backend logs: `sudo journalctl -u ai-girls -f`
2. Nginx logs: `/var/log/nginx/error.log`
3. Browser console (F12)
