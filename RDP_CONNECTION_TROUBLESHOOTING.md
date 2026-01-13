# Remote Desktop Connection Troubleshooting Guide

## ❌ Error: "Remote Desktop can't connect to the remote computer"

This error means RDP is not enabled or not accessible. Here are solutions:

---

## ✅ Solution 1: Enable RDP via VPS Control Panel (EASIEST)

### Step 1: Access Your VPS Control Panel

1. Log into Shinjiru: `billing.shinjiru.com.my`
2. Go to your VPS management page
3. Look for **"Management"** or **"Server Settings"** section

### Step 2: Enable Remote Desktop

Look for options like:
- **"Enable Remote Desktop"** checkbox
- **"RDP Access"** toggle
- **"Remote Access"** settings
- **"Windows Services"** configuration

Enable RDP if you find this option.

### Step 3: Check Firewall Rules

In the control panel, ensure:
- **Port 3389** (RDP) is open
- **Windows Firewall** allows RDP connections

---

## ✅ Solution 2: Use noVNC Console (RECOMMENDED IF AVAILABLE)

Since you saw a **"noVNC Console"** button in your control panel, use that instead!

### Step 1: Access noVNC Console

1. Go to your VPS control panel
2. Find the **"noVNC Console"** button
3. Click it to open a web-based console

### Step 2: Login to Windows

1. You'll see a Windows login screen in your browser
2. Enter your Administrator credentials
3. You now have full access to your Windows Server!

### Step 3: Enable RDP from noVNC Console

Once logged in via noVNC:

```powershell
# Open PowerShell as Administrator
# Right-click Start > Windows PowerShell (Admin)

# Enable Remote Desktop
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0

# Enable RDP in Windows Firewall
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

# Verify RDP is enabled
Get-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections"
# Should return: fDenyTSConnections : 0
```

### Step 4: Now Try RDP Again

After enabling RDP via noVNC, try connecting via Remote Desktop again.

---

## ✅ Solution 3: Enable RDP via PowerShell (If You Have Any Access)

If you have ANY way to run PowerShell commands (via control panel, API, etc.):

```powershell
# Enable Remote Desktop
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0

# Configure RDP to allow connections
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name "UserAuthentication" -value 0

# Enable RDP in Windows Firewall
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"

# Restart RDP service (optional)
Restart-Service TermService -Force
```

---

## ✅ Solution 4: Contact Shinjiru Support

If you can't access the server at all:

1. **Contact Shinjiru Support:**
   - Email: support@shinjiru.com
   - Live Chat: Available in your client area
   - Phone: Check your client area for support number

2. **Ask them to:**
   - Enable Remote Desktop on your VPS
   - Open port 3389 in the firewall
   - Provide RDP access credentials

3. **Tell them:**
   > "I need to enable Remote Desktop access on my Windows Server 2022 VPS (IP: 124.217.248.113). Can you please enable RDP and open port 3389?"

---

## ✅ Solution 5: Use Alternative Access Methods

### Option A: SSH (If Available)

Some Windows Server 2022 installations have OpenSSH enabled:

```powershell
# From your local PC
ssh Administrator@124.217.248.113
```

### Option B: WinRM (Windows Remote Management)

```powershell
# Enable WinRM (if you have any access)
Enable-PSRemoting -Force

# Connect via WinRM
Enter-PSSession -ComputerName 124.217.248.113 -Credential Administrator
```

---

## 🔍 Verify RDP is Working

After enabling RDP, verify it's accessible:

### From Your Local PC:

```powershell
# Test if port 3389 is open
Test-NetConnection -ComputerName 124.217.248.113 -Port 3389
```

If it shows "TcpTestSucceeded : True", RDP is accessible!

---

## 📋 Complete RDP Setup Checklist

Once you have access (via noVNC or support):

- [ ] Enable Remote Desktop via PowerShell
- [ ] Configure Windows Firewall to allow RDP
- [ ] Verify port 3389 is open
- [ ] Test RDP connection from local PC
- [ ] Note down Administrator password
- [ ] (Optional) Create a non-admin user for RDP

---

## 🚀 After RDP is Working

Once you can connect via RDP:

1. **Install Docker Desktop** (see `WINDOWS_SERVER_2022_DEPLOYMENT.md`)
2. **Upload your code** to `C:\MyMasjidApp`
3. **Run deployment script:** `.\deploy-windows.ps1`

---

## 🆘 Still Can't Connect?

### Check These:

1. **Is the server running?**
   - Check in your VPS control panel
   - Look for "Status: Online" or similar

2. **Is your IP blocked?**
   - Some providers block RDP from certain IPs
   - Try from a different network/VPN

3. **Is port 3389 blocked by your ISP?**
   - Some ISPs block port 3389
   - Try using a VPN

4. **Wrong credentials?**
   - Verify username: Usually `Administrator` or provided by host
   - Check password in your VPS control panel

---

## 💡 Recommended Next Steps

**Best approach:**

1. ✅ **Use noVNC Console** (if available) - This is the easiest!
2. ✅ **Enable RDP** from noVNC console
3. ✅ **Then use RDP** for easier access
4. ✅ **Deploy your application**

---

## 📞 Need More Help?

If you're still stuck:

1. **Check Shinjiru documentation** for VPS access
2. **Contact Shinjiru support** - they can enable RDP for you
3. **Try noVNC console** - it's usually always available

The noVNC console is your best bet if RDP isn't working! 🎯



