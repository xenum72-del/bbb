# ☁️ Azure Cloud Backup - Enterprise-Grade Data Protection

> **Complete guide to setting up and using Microsoft Azure cloud backup for your intimate data**

---

## 🏆 Why Azure Cloud Backup?

Azure Cloud Backup provides **enterprise-grade security** for your most intimate data with:

- **🔒 Bank-Level Encryption**: AES-256 encryption in transit and at rest
- **🌍 Global Access**: Access your backups from anywhere with internet
- **📂 Version History**: Multiple timestamped backups with retention management
- **🔄 Automatic Backups**: Optional auto-backup when you add/edit data
- **💰 Cost Effective**: Pay only for storage used (usually pennies per month)
- **🛡️ Your Control**: Your data, your container, complete privacy

---

## 🚀 Quick Setup Guide

### Prerequisites
1. **Microsoft Azure Account** (free tier available)
2. **Azure Storage Account** (create in Azure Portal)
3. **Blob Container** (create within storage account)
4. **Access Credentials** (SAS token or storage key)

### 5-Minute Setup
1. **Create Azure Resources** (see detailed steps below)
2. **Open The Load Down** → Settings → Azure Backup & Restore
3. **Enter Credentials** (storage account, container, SAS token)
4. **Test Connection** (verify everything works)
5. **Create First Backup** (one-click backup creation)

---

## 🔧 Detailed Azure Setup

### Step 1: Create Azure Storage Account

#### Using Azure Portal
1. **Sign in** to [Azure Portal](https://portal.azure.com)
2. **Create Resource** → **Storage** → **Storage Account**
3. **Configure Basic Settings**:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Storage Account Name**: Choose unique name (e.g., `myloaddownbackup`)
   - **Region**: Choose region closest to you
   - **Performance**: Standard (sufficient for backups)
   - **Redundancy**: LRS (Locally Redundant Storage) - most cost-effective

4. **Advanced Settings**:
   - **Security**: Enable secure transfer required
   - **Access Tier**: Hot (for frequently accessed backups)
   - **Blob Public Access**: Disabled (for security)

5. **Review + Create** → **Create**

### Step 2: Create Blob Container

1. **Navigate** to your newly created storage account
2. **Left Menu** → **Data Storage** → **Containers**
3. **+ Container** button
4. **Container Settings**:
   - **Name**: `backups` (or any name you prefer)
   - **Public Access Level**: Private (no anonymous access)
5. **Create**

### Step 3: Generate SAS Token (Recommended)

#### Using Azure Portal
1. **Storage Account** → **Security + Networking** → **Shared Access Signature**
2. **Allowed Services**: ✅ Blob
3. **Allowed Resource Types**: ✅ Object
4. **Allowed Permissions**: ✅ Read, ✅ Write, ✅ Delete, ✅ List
5. **Start Date/Time**: Current date/time
6. **Expiry Date/Time**: 1 year from now (or your preferred duration)
7. **Allowed Protocols**: HTTPS only
8. **Generate SAS and Connection String**
9. **Copy the SAS Token** (starts with `?sv=...`)

#### Alternative: Storage Account Key
1. **Storage Account** → **Security + Networking** → **Access Keys**
2. **Show Keys** → Copy **Key1** value
3. **Note**: Less secure than SAS token but simpler to use

---

## 📱 App Configuration

### Accessing Azure Backup Settings

1. **Open The Load Down**
2. **Settings** (⚙️ icon) → **Data Management**
3. **Azure Backup & Restore** button
4. **Azure Backup Modal** opens

### Entering Configuration

#### Required Fields
```
Storage Account Name: myloaddownbackup
Container Name: backups
SAS Token: ?sv=2023-01-03&ss=b&srt=o&sp=rwdl&se=2025-10-15...
```

#### Optional Fields
```
Storage Account Key: [if using key instead of SAS token]
```

#### Auto-Backup Settings
```
✅ Enable Auto Backup: Automatically backup when data changes
Container: auto-backups (separate container for auto backups)
Retention: 10 backups (keep 10 most recent auto backups)  
```

### Testing Your Configuration

1. **Fill in all required fields**
2. **Test Connection** button
3. **Wait for result**:
   - ✅ **"Connected"**: Configuration successful
   - ❌ **"Error"**: Check credentials and try again

#### Troubleshooting Connection Issues
- **"Access Denied"**: Check SAS token permissions include Read, Write, List
- **"Container Not Found"**: Verify container name matches exactly
- **"Invalid Account"**: Check storage account name spelling
- **"Network Error"**: Check internet connection and firewall settings

---

## 💾 Creating Backups

### Manual Backup Creation

1. **Test Connection** first (should show "Connected")
2. **Create Backup** button
3. **Confirm Action**: "This will create a backup of all your data in Azure. Continue?"
4. **Progress Tracking**: Watch progress bar and status messages:
   - "Starting backup..."
   - "Preparing backup data..."  
   - "Uploading to Azure..."
   - "Backup completed!"
5. **Success Message**: Shows backup ID and timestamp
6. **Backup List Updates**: New backup appears in the list

### Backup File Naming

Backups are automatically named with timestamps:
```
user_[userID]_backup_[timestamp].json
Example: user_abc123_backup_1729123456789.json
```

Display format in app:
```
October 15, 2025, 3:45:23 PM
Size: 2.3 MB
```

### Auto-Backup Configuration

#### Enabling Auto-Backup
1. **Azure Backup Settings** → **Auto Backup Settings**
2. **✅ Enable Auto Backup** toggle
3. **Configure Settings**:
   - **Container**: `auto-backups` (recommended separate container)
   - **Retention**: `10` backups (keep 10 most recent)

#### How Auto-Backup Works
- **Triggers**: Automatically creates backup when you:
  - Add new friends
  - Log new encounters
  - Edit existing data
  - Change settings
- **Frequency**: Maximum once per session (not every single change)
- **Background**: Happens asynchronously without blocking the UI
- **Retention**: Automatically deletes oldest backups beyond retention limit
- **Naming**: Prefixed with `auto_` for easy identification

#### Auto-Backup Benefits
- **No Manual Work**: Set it once, forget about it
- **Regular Protection**: Always have recent backups
- **Rolling Retention**: Prevents storage accumulation
- **Separate Container**: Doesn't clutter manual backups

---

## 🔄 Restoring from Backups

### Viewing Available Backups

**Backup List Shows**:
- **Timestamp**: When backup was created
- **File Name**: Full backup filename  
- **Size**: Backup file size
- **Actions**: Restore and Delete buttons

### Restoration Process

1. **Select Backup**: Find the backup you want to restore
2. **Restore Button** → **Confirm Action**:
   ```
   "This will replace ALL your current data with the backup from 
   October 15, 2025, 3:45:23 PM. This cannot be undone. Continue?"
   ```
3. **Progress Tracking**:
   - "Downloading backup..."
   - "Clearing existing data..."
   - "Restoring friends..."
   - "Restoring encounters..."
   - "Restoring settings..."
   - "Restore completed!"
4. **Success Message**: "Restore completed successfully! Please refresh the page to see changes."
5. **Manual Refresh**: Reload the page to see restored data

### ⚠️ Important Restoration Notes

- **Complete Replacement**: Restoration replaces ALL current data
- **No Undo**: Cannot undo a restoration (backup first if unsure)
- **Requires Refresh**: Must refresh page/app after restoration
- **Internet Required**: Must be online to download backup
- **Verification**: Check data after restoration to ensure completeness

---

## 🗑️ Managing Backups

### Deleting Backups

1. **Select Backup** to delete
2. **Delete Button** → **Confirm Action**:
   ```
   "Delete backup October 15, 2025, 3:45:23 PM? This cannot be undone."
   ```
3. **Permanent Deletion**: Backup is permanently removed from Azure
4. **List Updates**: Backup disappears from the list

### Storage Management

#### Monitoring Usage
- **Azure Portal**: View storage consumption in your storage account
- **Cost Analysis**: Monitor monthly costs (usually minimal)
- **Container Organization**: Separate manual and auto backups for clarity

#### Cost Optimization
- **Regular Cleanup**: Delete very old backups you no longer need
- **Auto-Backup Retention**: Use reasonable retention (5-15 backups)
- **Cool Storage Tier**: Move very old backups to cooler tiers for lower cost

### Configuration Management

#### Export Configuration
1. **Export Config** button
2. **Saves**: `azure-backup-config-2025-10-15.json`
3. **Use Case**: Share configuration across devices or backup settings

#### Import Configuration
1. **Import Config** button
2. **Select File**: Choose previously exported config file
3. **Auto-Fill**: All settings populated automatically
4. **Test Connection**: Verify imported settings work

---

## 🔒 Security & Privacy

### Data Encryption

#### In Transit
- **HTTPS Only**: All communication encrypted with TLS 1.2+
- **Certificate Validation**: Verifies Microsoft Azure certificates
- **No Plaintext**: Data never transmitted unencrypted

#### At Rest
- **AES-256**: Microsoft Azure encrypts all stored data
- **Key Management**: Microsoft manages encryption keys
- **Compliance**: Meets enterprise security standards

### Access Control

#### Your Control
- **Your Account**: You own the Azure storage account
- **Your Keys**: You control access credentials
- **Your Data**: Complete ownership of all backup data
- **Your Rules**: Set your own retention and access policies

#### Microsoft's Role
- **Infrastructure Only**: Provides storage infrastructure
- **No Data Access**: Microsoft cannot access your backup content
- **Compliance**: Meets GDPR, HIPAA, and other privacy regulations
- **Transparency**: Clear data handling policies

### Privacy Guarantees

#### What We Store
- **Your Data Only**: Only the data you explicitly backup
- **Encrypted Format**: Data stored in encrypted JSON format
- **No Analytics**: No usage tracking or analytics on backup data
- **No Sharing**: Zero sharing with third parties

#### What We Don't Store
- **No Personal Info**: We don't store your Azure credentials
- **No Metadata**: No tracking of when/how often you backup
- **No Analytics**: No analysis of your backup patterns
- **No Access**: We cannot access your backups

---

## 📊 Backup Best Practices

### Frequency Recommendations

#### Manual Backups
- **After Major Changes**: Big data additions or modifications
- **Before App Updates**: Backup before installing app updates
- **Weekly Routine**: Regular weekly backups for peace of mind
- **Before Device Changes**: Always backup before switching phones

#### Auto-Backup Settings
- **Enable for Convenience**: Set up auto-backup for regular protection
- **Reasonable Retention**: 5-15 backups (balance protection vs. cost)
- **Separate Container**: Use dedicated container for auto-backups
- **Monitor Storage**: Occasionally check Azure storage usage

### Security Best Practices

#### Credential Management
- **SAS Token Preferred**: More secure than storage account keys
- **Regular Rotation**: Regenerate SAS tokens annually
- **Minimal Permissions**: Only grant necessary permissions (Read, Write, List)
- **Secure Storage**: Store credentials securely (password manager)

#### Access Control
- **Private Containers**: Never allow public access to backup containers
- **Strong Passwords**: Use strong Azure account password + 2FA
- **Regular Review**: Periodically review who has access to your Azure account
- **Backup Cleanup**: Delete old backups you no longer need

### Cross-Device Strategy

#### Multi-Device Setup
1. **Export Config** from primary device
2. **Import Config** on secondary devices
3. **Test Connection** on each device
4. **Selective Restore**: Restore latest backup on new devices

#### Device Migration
1. **Create Fresh Backup** on old device
2. **Install App** on new device
3. **Configure Azure** with same credentials
4. **Restore Latest Backup** to new device
5. **Verify Data** completeness on new device

---

## 🆘 Troubleshooting Guide

### Common Issues

#### "Connection Failed"
**Possible Causes**:
- Incorrect storage account name
- Wrong container name
- Invalid SAS token
- Expired SAS token
- No internet connection

**Solutions**:
1. **Double-Check Spelling**: Verify all names exactly match Azure
2. **Regenerate SAS Token**: Create new token with proper permissions
3. **Test Internet**: Ensure stable internet connection
4. **Check Container**: Verify container exists and is accessible

#### "Access Denied"
**Possible Causes**:
- SAS token missing required permissions
- SAS token expired
- Container access level too restrictive
- Storage account firewall rules

**Solutions**:
1. **Check Permissions**: SAS token needs Read, Write, List permissions
2. **Verify Expiry**: Ensure SAS token hasn't expired
3. **Container Settings**: Verify container allows your access method
4. **Firewall Rules**: Check if storage account has IP restrictions

#### "Backup Failed"
**Possible Causes**:
- Network interruption during upload
- Insufficient storage quota
- Large backup size timeout
- Temporary Azure service issue

**Solutions**:
1. **Retry**: Try creating backup again
2. **Check Connection**: Ensure stable internet throughout process
3. **Storage Quota**: Verify Azure storage account has sufficient space  
4. **Contact Support**: If issue persists, contact Azure support

#### "Restore Failed"
**Possible Causes**:
- Network interruption during download
- Corrupted backup file
- Insufficient device storage
- App storage permissions

**Solutions**:
1. **Retry**: Try restoring again with stable internet
2. **Different Backup**: Try restoring from a different backup
3. **Free Space**: Ensure sufficient device storage space
4. **App Permissions**: Check app has necessary storage permissions

### Advanced Troubleshooting

#### Network Diagnostics
```bash
# Test connectivity to Azure Blob Storage
curl -I https://[storage-account].blob.core.windows.net/

# Verify DNS resolution
nslookup [storage-account].blob.core.windows.net
```

#### Azure Portal Diagnostics
1. **Storage Account** → **Monitoring** → **Insights**
2. **Check Metrics**: Request rates, error rates, latency
3. **Activity Log**: Recent operations and any errors
4. **Alerts**: Set up alerts for failures or unusual activity

---

## 💰 Cost Management

### Understanding Azure Storage Costs

#### Cost Components
- **Storage**: ~$0.02 per GB per month (Hot tier)
- **Operations**: ~$0.0004 per 10,000 operations
- **Data Transfer**: Free inbound, minimal outbound costs

#### Typical Costs for The Load Down
- **Small Dataset** (1-5MB): ~$0.0001 per month
- **Medium Dataset** (10-50MB): ~$0.001 per month  
- **Large Dataset** (100MB+): ~$0.01 per month

**Reality**: Most users pay less than $0.10 per month!

#### Cost Optimization Tips
- **Regular Cleanup**: Delete very old backups
- **Archive Old Backups**: Move rarely accessed backups to Archive tier
- **Monitor Usage**: Set up Azure cost alerts
- **Reasonable Retention**: Don't keep unlimited auto-backups

### Azure Free Tier Benefits

#### What's Includes (Free for 12 months)
- **5GB Blob Storage**: More than enough for backup needs
- **20,000 Read Operations**: Plenty for backup/restore operations
- **10,000 Write Operations**: Sufficient for regular backups

#### After Free Tier
- **Pay-as-you-use**: Only pay for what you actually use
- **Predictable Costs**: Storage costs scale linearly with usage
- **Cost Controls**: Set spending limits and alerts

---

*Next: [Device Migration](Device-Migration) →*