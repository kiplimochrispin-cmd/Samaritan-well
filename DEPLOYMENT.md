# Deployment Guide (Public Domain + HTTPS)

## 1) Server prerequisites
- Ubuntu/Debian VM with a public IP
- A domain name (example: `yourdomain.com`) pointed to that VM (A record)
- Installed: `node` (v24+), `nginx`, `certbot`, `python3-certbot-nginx`

## 2) Copy project to server
```bash
sudo mkdir -p /opt/santa-shepherds-water
sudo chown -R $USER:$USER /opt/santa-shepherds-water
rsync -av ./ /opt/santa-shepherds-water/
cd /opt/santa-shepherds-water
```

## 3) Start app with systemd
```bash
sudo cp deploy/santa-shepherds.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable santa-shepherds
sudo systemctl start santa-shepherds
sudo systemctl status santa-shepherds
```

## 4) Configure Nginx reverse proxy
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/santa-shepherds
sudo ln -s /etc/nginx/sites-available/santa-shepherds /etc/nginx/sites-enabled/santa-shepherds
sudo nginx -t
sudo systemctl reload nginx
```

Edit `/etc/nginx/sites-available/santa-shepherds` and replace `yourdomain.com` with your real domain.

## 5) Enable HTTPS certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 6) Verify deployment
- Main site: `https://yourdomain.com`
- Programs page: `https://yourdomain.com/programs.html`
- Contact page: `https://yourdomain.com/contact.html`
- Admin dashboard: `https://yourdomain.com/admin.html`

## 7) Logs and operations
```bash
sudo journalctl -u santa-shepherds -f
sudo systemctl restart santa-shepherds
```

## Docker alternative
Run on a server with Docker:
```bash
docker build -t santa-shepherds-water .
docker run -d --name santa-shepherds -p 8080:8080 -v $(pwd)/data:/app/data santa-shepherds-water
```
Then put Nginx in front for domain + HTTPS.

## Security notes
- Protect `admin.html` behind HTTP auth or VPN before production use.
- Add a real payment gateway before processing live card details.
- Keep backups of `/opt/santa-shepherds-water/data/orders.db`.
