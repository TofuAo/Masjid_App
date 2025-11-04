# MyMasjidApp Security Guide

This guide outlines security best practices and configurations for the MyMasjidApp deployment.

## 🔒 Security Features Already Implemented

### Application Security
✅ **Password Hashing**
- Uses bcryptjs with 12 rounds
- Passwords are never stored in plain text
- Implementation: `backend/controllers/authController.js`

✅ **SQL Injection Protection**
- All queries use parameterized statements (mysql2/promise)
- No string concatenation in SQL queries
- Example: `pool.execute("SELECT * FROM users WHERE email = ?", [email])`

✅ **JWT Authentication**
- Tokens expire after 24 hours (configurable)
- Secure token generation and validation
- Implementation: `backend/middleware/auth.js`

✅ **Input Validation**
- Express-validator for request validation
- Type checking and sanitization
- Implementation: All controller routes

✅ **Rate Limiting**
- API rate limiting: 10 requests/second
- Login endpoint: 5 requests/minute
- Implementation: `express-rate-limit` in `server.js`

✅ **Security Headers**
- Helmet.js configured for security headers
- XSS protection
- Content type protection
- Implementation: `backend/server.js`

✅ **CORS Configuration**
- Whitelist-based origin checking
- Credentials support
- Configurable allowed origins
- Implementation: `backend/server.js`

✅ **HTTPS/SSL Support**
- Nginx SSL/TLS configuration
- HTTP to HTTPS redirect
- Strong cipher suites
- HSTS (HTTP Strict Transport Security)

## 📋 Security Checklist for Production

### Pre-Deployment Security

- [ ] **Change Default Passwords**
  - Database root password
  - Database user password
  - JWT secret (minimum 32 characters, random)
  - Update in `backend/.env`

- [ ] **Secure Environment Variables**
  - Never commit `.env` files to git
  - Use strong, unique values for:
    - `JWT_SECRET` (use: `openssl rand -base64 32`)
    - `DB_PASSWORD` (use: `openssl rand -base64 16`)
  - Restrict file permissions: `chmod 600 backend/.env`

- [ ] **Database Security**
  - Create dedicated database user (not root)
  - Grant only necessary permissions
  - Use strong password
  - Disable remote root login

### Infrastructure Security

- [ ] **Firewall Configuration (UFW)**
  ```bash
  # Allow only necessary ports
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw deny 3306/tcp   # MySQL (if external, use SSH tunnel)
  sudo ufw enable
  ```

- [ ] **SSH Security**
  ```bash
  # Use SSH keys instead of passwords
  ssh-keygen -t rsa -b 4096
  
  # Disable root login
  sudo nano /etc/ssh/sshd_config
  # Set: PermitRootLogin no
  # Set: PasswordAuthentication no (after setting up keys)
  
  sudo systemctl restart sshd
  ```

- [ ] **Fail2Ban Installation**
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

- [ ] **Regular System Updates**
  ```bash
  # Set up automatic security updates
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

### Application Security

- [ ] **Dependency Security**
  ```bash
  # Check for vulnerable packages
  npm audit
  npm audit fix
  
  # Regular updates
  npm update
  ```

- [ ] **Environment Security**
  ```bash
  # Set proper file permissions
  chmod 600 backend/.env
  chmod 600 .env
  
  # Ensure .env is in .gitignore
  echo ".env" >> .gitignore
  echo "backend/.env" >> .gitignore
  ```

- [ ] **Database Access Control**
  - Limit database user permissions
  - Use read-only user for reports if possible
  - Enable SSL for database connections (if external)

### Network Security

- [ ] **Nginx Security Headers**
  - Already configured in `nginx/nginx.conf`
  - Verify X-Frame-Options, X-Content-Type-Options
  - HSTS header configured

- [ ] **Rate Limiting**
  - Already configured in Nginx and Express
  - Adjust limits based on your needs
  - Monitor for abuse

- [ ] **SSL/TLS Configuration**
  - Use TLS 1.2+ only (configured)
  - Strong cipher suites (configured)
  - Regular certificate renewal (auto-renewal recommended)

## 🛡️ Additional Security Measures

### 1. Database Security

**Create Limited-Privilege User:**
```sql
-- Instead of full privileges, grant only what's needed
GRANT SELECT, INSERT, UPDATE, DELETE ON masjid_app.* TO 'masjid_user'@'%';
-- Revoke dangerous privileges
REVOKE DROP, CREATE, ALTER ON *.* FROM 'masjid_user'@'%';
FLUSH PRIVILEGES;
```

**Enable MySQL SSL (for external connections):**
```ini
# In MySQL configuration
[mysqld]
ssl-ca=/path/to/ca.pem
ssl-cert=/path/to/server-cert.pem
ssl-key=/path/to/server-key.pem
```

### 2. Logging and Monitoring

**Set up Log Rotation:**
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/masjid-app

# Content:
/path/to/MyMasjidApp/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        docker-compose restart nginx
    endscript
}
```

**Monitor Failed Login Attempts:**
```bash
# Check authentication logs
docker-compose logs backend | grep -i "login\|auth\|401"

# Set up alerts for suspicious activity
```

### 3. Backup Security

**Secure Backup Storage:**
```bash
# Encrypt backups
gpg --symmetric backups/masjid_app_backup.sql.gz

# Store backups off-site
# Use encrypted cloud storage
# Set up backup rotation
```

**Backup Access Control:**
```bash
# Restrict backup file permissions
chmod 600 backups/*.sql.gz

# Use secure transfer methods (SFTP, not FTP)
```

### 4. Application-Level Security

**Add Request Size Limits:**
```javascript
// Already configured in server.js
app.use(express.json({ limit: '10mb' }));
```

**Implement Content Security Policy:**
```javascript
// In server.js, add to helmet config
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
})
```

### 5. Docker Security

**Run Containers as Non-Root:**
- ✅ Already implemented in Dockerfiles
- Backend uses `nodejs` user (UID 1001)
- Frontend runs as nginx user

**Limit Container Resources:**
```yaml
# In docker-compose.yml, add to services:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

**Scan Images for Vulnerabilities:**
```bash
# Use Trivy or similar tools
docker scan masjid-app-backend
```

## 🔍 Security Audit Checklist

Run these regularly:

- [ ] Review application logs for suspicious activity
- [ ] Check for failed login attempts
- [ ] Verify SSL certificate expiration date
- [ ] Review user permissions and roles
- [ ] Check for unauthorized access
- [ ] Review database access logs
- [ ] Verify backup integrity
- [ ] Check for system updates
- [ ] Review dependency vulnerabilities (`npm audit`)
- [ ] Test rate limiting effectiveness
- [ ] Verify security headers are present
- [ ] Check firewall rules

## 🚨 Incident Response

### If Security Breach is Suspected

1. **Immediate Actions:**
   ```bash
   # Isolate the system
   docker-compose stop
   
   # Change all passwords immediately
   # Rotate JWT secret
   # Revoke all active sessions
   ```

2. **Investigation:**
   ```bash
   # Review logs
   docker-compose logs --tail=1000
   cat nginx/logs/access.log | grep suspicious-ip
   
   # Check database for unauthorized changes
   # Review user activity
   ```

3. **Containment:**
   - Disable affected user accounts
   - Block suspicious IP addresses
   - Restore from clean backup if needed

4. **Notification:**
   - Notify affected users if data was compromised
   - Document the incident
   - Report if legally required

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Nginx Security](https://nginx.org/en/docs/http/configuring_https_servers.html)

## 🔐 Password Policy Recommendations

Implement in your application:

- Minimum 8 characters
- Require uppercase, lowercase, numbers
- Require special characters
- Enforce password expiration (90 days)
- Prevent password reuse
- Account lockout after failed attempts

## 📝 Security Maintenance Schedule

### Daily
- Monitor logs for suspicious activity
- Check for failed login attempts

### Weekly
- Review access logs
- Check system updates
- Verify backups

### Monthly
- Security audit
- Dependency updates
- Review user permissions
- Test backup restoration

### Quarterly
- Full security review
- Penetration testing (if possible)
- Update security documentation
- Review and update firewall rules

---

## Quick Security Commands

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure password
openssl rand -base64 16

# Check for vulnerable dependencies
npm audit

# Test SSL configuration
openssl s_client -connect yourdomain.com:443

# Check security headers
curl -I https://yourdomain.com

# Monitor failed logins
docker-compose logs backend | grep -i "401\|unauthorized"

# Check open ports
sudo netstat -tulpn

# Review firewall rules
sudo ufw status verbose
```

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.

