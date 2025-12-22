# MyMasjidApp - Hosting Requirements Analysis

## ⚠️ Important: You Need VPS, NOT Shared Hosting

The plan you're looking at appears to be **Shared Hosting** (WordPress-focused), which **will NOT work** for your Docker-based application.

---

## 🔍 What Your System Actually Needs

### Your Application Stack:
- ✅ **4 Docker Containers:**
  - MySQL 8.0 database
  - Node.js backend (Express API)
  - React frontend (Nginx-served)
  - Nginx reverse proxy

### Required Features:
1. **Full Root/SSH Access** - To install Docker and manage containers
2. **Docker & Docker Compose Support** - Essential for your setup
3. **Custom Port Configuration** - Ports 80, 443, 5000, 3306
4. **Persistent Storage** - For database and file uploads
5. **Resource Allocation:**
   - **Minimum:** 1GB RAM, 1 CPU core, 20GB storage
   - **Recommended:** 2GB RAM, 2 CPU cores, 40GB storage

---

## ❌ Why Shared Hosting Won't Work

| Feature | Shared Hosting | Your Needs |
|---------|---------------|------------|
| Docker Support | ❌ No | ✅ Required |
| Root/SSH Access | ❌ Limited | ✅ Required |
| Custom Applications | ❌ WordPress only | ✅ Custom Node.js app |
| Port Control | ❌ No | ✅ Required |
| Multiple Services | ❌ Single app | ✅ 4 containers |
| Database Control | ❌ Shared MySQL | ✅ Your own MySQL |

---

## ✅ What You Actually Need: VPS (Virtual Private Server)

### Minimum VPS Requirements for Early Stage:

**For Small Scale (50-100 users):**
- **RAM:** 1GB (minimum) / 2GB (recommended)
- **CPU:** 1 core (minimum) / 2 cores (recommended)
- **Storage:** 20GB SSD (minimum) / 40GB (recommended)
- **Bandwidth:** 1TB/month (usually sufficient)
- **OS:** Ubuntu 22.04 LTS
- **Cost:** RM 30-60/month (~$7-14 USD)

**For Medium Scale (100-500 users):**
- **RAM:** 2GB
- **CPU:** 2 cores
- **Storage:** 40GB SSD
- **Bandwidth:** 2TB/month
- **Cost:** RM 60-100/month (~$14-23 USD)

---

## 🎯 Recommended Exabytes VPS Plans for Your System

### Option 1: Exabytes VPS Starter (Early Stage) ⭐ RECOMMENDED
- **RAM:** 1GB
- **CPU:** 1 core
- **Storage:** 25GB SSD
- **Bandwidth:** 1TB/month
- **Location:** Cyberjaya or Penang
- **Price:** ~RM 30-50/month
- **Suitable for:** Early stage, testing, small masjid (< 100 users)

### Option 2: Exabytes VPS Business (Recommended)
- **RAM:** 2GB
- **CPU:** 2 cores
- **Storage:** 50GB SSD
- **Bandwidth:** 2TB/month
- **Location:** Cyberjaya or Penang
- **Price:** ~RM 60-80/month
- **Suitable for:** Production, medium masjid (100-500 users)

### Option 3: Exabytes VPS Professional (Future Growth)
- **RAM:** 4GB
- **CPU:** 2-4 cores
- **Storage:** 100GB SSD
- **Bandwidth:** 3TB/month
- **Price:** ~RM 100-150/month
- **Suitable for:** Large masjid, high traffic

---

## 📊 Resource Usage Estimate

### Your Docker Containers:
1. **MySQL:** ~200-300MB RAM
2. **Node.js Backend:** ~150-250MB RAM
3. **Nginx (Frontend):** ~50-100MB RAM
4. **Nginx (Reverse Proxy):** ~50-100MB RAM
5. **System + Docker:** ~200-300MB RAM

**Total:** ~650MB - 1GB RAM (minimum)
**Recommended:** 2GB RAM for comfortable operation

---

## ✅ Is 1GB RAM VPS Sufficient for Early Stage?

### YES, but with considerations:

**✅ Will Work:**
- Small user base (< 100 users)
- Low to moderate traffic
- Basic features in use
- Testing and development

**⚠️ Limitations:**
- May need to restart containers occasionally
- Limited concurrent users
- Slower response during peak times
- No room for growth

**💡 Recommendation:**
- **Start with 1GB** if budget is tight (RM 30-50/month)
- **Upgrade to 2GB** when you have 50+ active users (RM 60-80/month)
- **Monitor usage** and scale up as needed

---

## 🚀 Quick Comparison: Shared Hosting vs VPS

### Shared Hosting (What you're looking at):
```
❌ Cannot install Docker
❌ No root access
❌ WordPress-focused
❌ Limited customization
✅ Easy to use
✅ Cheaper (RM 10-30/month)
✅ Managed (but not for your needs)
```

### VPS (What you need):
```
✅ Full root access
✅ Install Docker & Docker Compose
✅ Complete control
✅ Custom applications
✅ Scalable
⚠️ Requires technical knowledge
💰 More expensive (RM 30-100/month)
```

---

## 📝 Action Plan

### Step 1: Choose the Right Plan
- **Early Stage:** Exabytes VPS Starter (1GB RAM) - RM 30-50/month
- **Production:** Exabytes VPS Business (2GB RAM) - RM 60-80/month

### Step 2: What to Look For
When browsing Exabytes VPS plans, ensure:
- ✅ **VPS** (not Shared Hosting)
- ✅ **Ubuntu 22.04 LTS** option
- ✅ **Root/SSH access** included
- ✅ **Cyberjaya or Penang** data center
- ✅ **At least 1GB RAM** (2GB recommended)
- ✅ **SSD storage** (20GB+)

### Step 3: Features You DON'T Need
- ❌ WordPress management (you're not using WordPress)
- ❌ LiteSpeed server (you're using Nginx in Docker)
- ❌ cPanel (optional, you'll use command line)
- ❌ Web design credit (not relevant)

### Step 4: Features You DO Need
- ✅ Full root/SSH access
- ✅ Docker support (you'll install it)
- ✅ Custom port access (80, 443)
- ✅ Persistent storage
- ✅ Backup solution (or set up your own)

---

## 💰 Cost Comparison

| Plan Type | Monthly Cost | Suitable For |
|-----------|--------------|--------------|
| Shared Hosting | RM 10-30 | ❌ Won't work for you |
| VPS Starter (1GB) | RM 30-50 | ✅ Early stage |
| VPS Business (2GB) | RM 60-80 | ✅ Production |
| VPS Professional (4GB) | RM 100-150 | ✅ Growth stage |

---

## 🎯 Final Recommendation

**For Early Stage:**
→ **Exabytes VPS Starter** (1GB RAM, 1 CPU, 25GB SSD)
- Price: RM 30-50/month
- Location: Cyberjaya or Penang
- Sufficient for: Testing, small user base, initial deployment

**Upgrade Path:**
1. Start with 1GB VPS (RM 30-50/month)
2. Monitor usage for 1-2 months
3. Upgrade to 2GB when you have 50+ active users
4. Scale further as needed

---

## ✅ Checklist Before Purchasing

- [ ] Plan is **VPS** (not Shared Hosting like EBiz 12)
- [ ] **NOT** labeled "EBiz", "Web Hosting", or "WordPress Hosting"
- [ ] **NOT** using PLESK or cPanel (those are shared hosting)
- [ ] At least **1GB RAM** (2GB recommended)
- [ ] **Ubuntu 22.04 LTS** available
- [ ] **Root/SSH access** included
- [ ] **Cyberjaya or Penang** data center
- [ ] **SSD storage** (20GB+)
- [ ] **1TB+ bandwidth** per month
- [ ] **No Entry Process (EP) limits** (VPS don't have these)
- [ ] Can install Docker (check with support if unsure)

## ⚠️ Common Mistake: EBiz 12 Plans

**EBiz 12 Mini/Plus/Pro/Max = Shared Hosting = Won't Work!**

Even if they have 2-4GB RAM, they are:
- ❌ Shared hosting (PLESK control panel)
- ❌ No root access
- ❌ No Docker support
- ❌ Entry Process limits (10-40)
- ❌ Active Process limits (100-400)

**You MUST find VPS plans, not EBiz plans!**

---

**Need Help?** Contact Exabytes support and ask:
> "I need a VPS plan that supports Docker and Docker Compose for a Node.js application. Do you have VPS plans with root access in Cyberjaya or Penang?"

