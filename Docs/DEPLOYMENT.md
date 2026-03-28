# Everbloom Deployment Guide

This guide covers various deployment options for the Everbloom memorial website.

## Deployment Options

### 1. Traditional VPS/Server Deployment
### 2. Cloud Platform Deployment (AWS, Google Cloud, Azure)
### 3. Container Deployment (Docker)
### 4. Serverless Deployment
### 5. Static Hosting with Cloud Functions

---

## Option 1: Traditional VPS/Server Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- Nginx (recommended)
- SSL certificate

### Step-by-Step Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Application Setup
```bash
# Create application directory
sudo mkdir -p /var/www/everbloom
sudo chown $USER:$USER /var/www/everbloom
cd /var/www/everbloom

# Clone your repository
git clone <your-repo-url> .

# Setup backend
cd backend
npm ci --only=production
cp .env.example .env

# Configure production environment
nano .env
```

**Production `.env` configuration:**
```env
NODE_ENV=production
PORT=3001
DB_PATH=/var/www/everbloom/database/everbloom.db
JWT_SECRET=your-super-strong-jwt-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 3. Database Setup
```bash
# Create database directory
sudo mkdir -p /var/www/everbloom/database
sudo chown $USER:$USER /var/www/everbloom/database

# Initialize database
npm run migrate
npm run seed  # Optional: for initial data
```

#### 4. Frontend Build
```bash
cd /var/www/everbloom
npm ci
npm run build
```

#### 5. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'everbloom-backend',
    script: './backend/src/server.js',
    cwd: '/var/www/everbloom',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/everbloom/error.log',
    out_file: '/var/log/everbloom/out.log',
    log_file: '/var/log/everbloom/combined.log',
    time: true
  }]
};
```

Start the application:
```bash
# Create log directory
sudo mkdir -p /var/log/everbloom
sudo chown $USER:$USER /var/log/everbloom

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 6. Nginx Configuration
Create `/etc/nginx/sites-available/everbloom`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend
    location / {
        root /var/www/everbloom/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/everbloom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Option 2: Docker Deployment

### Dockerfile (Backend)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

### Dockerfile (Frontend)
```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - ./database:/app/database
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  database:
```

### Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Option 3: Cloud Platform Deployment

### AWS Deployment

#### Using AWS EC2
1. Launch EC2 instance (t3.micro or larger)
2. Follow VPS deployment steps above
3. Configure security groups (ports 80, 443, 22)
4. Set up Elastic IP
5. Configure Route 53 for DNS

#### Using AWS Elastic Beanstalk
1. Create application in Elastic Beanstalk
2. Use Node.js platform
3. Upload your application zip
4. Configure environment variables
5. Set up load balancer and SSL

### Google Cloud Platform

#### Using Compute Engine
1. Create VM instance
2. Follow VPS deployment steps
3. Configure firewall rules
4. Set up Cloud DNS

#### Using App Engine
1. Create `app.yaml`:
```yaml
runtime: nodejs18
instance_class: F2
env_variables:
  NODE_ENV: 'production'
  PORT: '8080'
```

2. Deploy:
```bash
gcloud app deploy
```

---

## Option 4: Serverless Deployment

### Using Vercel (Frontend) + Railway/Render (Backend)

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Backend on Railway
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy automatically on push

### Using Netlify (Frontend) + Heroku (Backend)

#### Frontend on Netlify
```bash
# Build and deploy
npm run build
# Upload dist/ folder to Netlify
```

#### Backend on Heroku
```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

---

## Monitoring and Maintenance

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart everbloom-backend
```

### 2. Database Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/everbloom/database/everbloom.db /var/backups/everbloom_$DATE.db

# Set up cron job
0 2 * * * /path/to/backup-script.sh
```

### 3. Log Rotation
```bash
# Create /etc/logrotate.d/everbloom
/var/log/everbloom/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is set up in crontab
```

---

## Security Checklist

### ✅ Essential Security Measures
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular updates
- [ ] Database backups
- [ ] Monitoring and alerts

### ✅ Advanced Security
- [ ] IP whitelisting for admin
- [ ] CAPTCHA on forms
- [ ] Content Security Policy
- [ ] DDoS protection
- [ ] Intrusion detection
- [ ] Regular security audits

---

## Performance Optimization

### 1. Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Optimize images
- Minimize bundle size

### 2. Backend Optimization
- Use PM2 cluster mode
- Implement database indexing
- Enable query caching
- Use connection pooling
- Monitor performance metrics

### 3. Database Optimization
- Regular VACUUM operations
- Optimize queries
- Monitor database size
- Implement proper indexing

---

## Troubleshooting

### Common Issues
1. **Port conflicts** - Check with `netstat -tulpn`
2. **Permission errors** - Check file ownership
3. **Database locked** - Restart application
4. **SSL issues** - Verify certificate paths
5. **Memory issues** - Check PM2 logs

### Debug Commands
```bash
# Check application status
pm2 status
pm2 describe everbloom-backend

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check SSL certificate
sudo certbot certificates

# Monitor resources
htop
df -h
free -h
```

---

This deployment guide covers the most common deployment scenarios. Choose the option that best fits your requirements, budget, and technical expertise.
