# Migrating from Cloudflare to Vercel DNS

This guide walks you through migrating your menuiq.io domain from Cloudflare to Vercel for better wildcard subdomain support.

## Prerequisites
- Access to your domain registrar account
- Vercel Pro plan (required for wildcard domains)
- Access to Cloudflare dashboard
- SSH access to your backend server

## Step 1: Prepare for Migration

### 1.1 Document Current DNS Records
Before making changes, save your current DNS configuration:

1. Login to Cloudflare dashboard
2. Go to menuiq.io → DNS
3. Screenshot or note down all DNS records, especially:
   - A record for `api` pointing to your server IP
   - Any other custom records you've added

### 1.2 Ensure Backend Uses Let's Encrypt
Since Vercel will handle frontend SSL, your backend needs its own SSL certificate:

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate for api.menuiq.io
sudo certbot --nginx -d api.menuiq.io

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 2: Change Nameservers

### 2.1 At Your Domain Registrar
1. Login to your domain registrar (where you bought menuiq.io)
2. Find DNS/Nameserver settings
3. Change from Cloudflare nameservers to Vercel:
   ```
   Current (Cloudflare):
   - xxx.ns.cloudflare.com
   - yyy.ns.cloudflare.com
   
   New (Vercel):
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   ```
4. Save changes

### 2.2 Wait for Propagation
- DNS changes can take 5 minutes to 48 hours to propagate
- Check status: https://www.whatsmydns.net/
- Search for menuiq.io NS records

## Step 3: Configure Vercel

### 3.1 Add Domain to Vercel Project
```bash
# In your frontend directory
cd /Users/mahmouddinnawi/MenuSystem/frontend

# Add domains
vercel domains add menuiq.io
vercel domains add "*.menuiq.io"
```

### 3.2 Configure DNS in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Navigate to your project → Settings → Domains
3. Vercel should automatically configure:
   - Root domain (menuiq.io)
   - Wildcard (*.menuiq.io)

### 3.3 Add API Subdomain
In Vercel DNS settings, add:
- Type: A
- Name: api
- Value: YOUR_SERVER_IP
- TTL: 3600

## Step 4: Update Application Configuration

### 4.1 Backend CORS Settings
Ensure your backend allows the new domain configuration:

```python
# In main_mysql.py
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\.menuiq\.io|https://menuiq\.io|https://www\.menuiq\.io|http://localhost:3000|http://localhost:3001",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

### 4.2 Frontend Environment
Verify `.env.production`:
```env
REACT_APP_API_URL=https://api.menuiq.io
```

## Step 5: Testing

### 5.1 Check DNS Resolution
```bash
# Check nameservers
dig menuiq.io NS

# Check A record for API
dig api.menuiq.io A

# Check wildcard
dig test.menuiq.io A
```

### 5.2 Test SSL Certificates
- Visit https://menuiq.io - Should show valid SSL (Vercel)
- Visit https://api.menuiq.io - Should show valid SSL (Let's Encrypt)
- Visit https://entrecote.menuiq.io - Should show valid SSL (Vercel)

### 5.3 Test Application
1. Main domain: https://menuiq.io/login
2. API health: https://api.menuiq.io/
3. Tenant subdomain: https://entrecote.menuiq.io/menu

## Step 6: Post-Migration Cleanup

### 6.1 Update Documentation
- Update deployment guides
- Update any hardcoded Cloudflare references

### 6.2 Monitor for Issues
- Check browser console for CORS errors
- Monitor API logs for SSL issues
- Test all tenant subdomains

## Rollback Plan

If issues occur, you can revert to Cloudflare:
1. Change nameservers back to Cloudflare at your registrar
2. DNS records are still saved in Cloudflare
3. Re-enable Cloudflare proxy for your records

## Benefits of Vercel DNS

1. **Native Wildcard Support**: Automatic SSL for all subdomains
2. **Simplified Management**: DNS and hosting in one place
3. **Automatic SSL**: No manual certificate management for frontend
4. **Better Performance**: Optimized for Vercel's edge network

## Common Issues and Solutions

### Issue: API not accessible after migration
**Solution**: Ensure Let's Encrypt certificate is properly installed and api A record is added in Vercel DNS

### Issue: CORS errors on tenant subdomains
**Solution**: Deploy updated backend with proper CORS regex pattern

### Issue: SSL certificate warnings
**Solution**: Wait for Vercel to provision certificates (can take up to 10 minutes after domain verification)

### Issue: Some subdomains not working
**Solution**: Ensure you have Vercel Pro plan and wildcard domain is properly added

## Timeline Estimate

- Preparation: 30 minutes
- Nameserver change: 5 minutes
- DNS propagation: 5 minutes - 48 hours (usually 1-2 hours)
- Vercel configuration: 15 minutes
- Testing: 30 minutes

Total active work: ~1.5 hours
Total elapsed time: 2-48 hours (depending on DNS propagation)