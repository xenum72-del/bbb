# ☁️ Backup & Export - Data Protection & Portability

> **Comprehensive guide to protecting and exporting your The Load Down data**

---

## 🎯 Why Backup & Export Matter

Your relationship data is precious - every encounter, every friend profile, every rating represents real memories and experiences. **Backup & Export** features ensure you never lose this valuable information and can move it between devices when needed.

**Key Benefits:**
- **🛡️ Data Protection**: Safeguard against device loss, damage, or app issues
- **📱 Device Migration**: Move data when upgrading phones or switching devices  
- **☁️ Cloud Security**: Enterprise-grade Azure Blob Storage with encryption
- **📂 Local Control**: Export JSON files for complete data ownership
- **🔄 Easy Restoration**: Simple restore process from any backup

---

## ☁️ Azure Backup (Recommended)

### 🌟 Enterprise-Grade Cloud Backup

The Azure Backup feature provides professional-level data protection using Microsoft's enterprise cloud infrastructure. Your data is encrypted, versioned, and stored securely in Azure Blob Storage.

#### **✨ Azure Backup Features**
```
🔐 AES-256 Encryption: Military-grade data protection (PIN-based)
📅 Date-Based Backups: Select specific backup dates to restore
🗂️ Automatic Organization: Backups organized by date and time
⚡ Fast Upload/Download: Optimized for mobile networks
🔄 Automatic Cleanup: Configurable retention policies
📊 Progress Tracking: Real-time backup/restore progress
🔒 Smart Encryption: Automatic encryption when PIN protection enabled
📁 Backup Naming: Clear filenames with encryption status indication
```

### 🚀 Setting Up Azure Backup

#### **Prerequisites**
1. **Azure Storage Account**: Create free account at portal.azure.com
2. **Container Creation**: Create a container named "backups" 
3. **Access Token**: Generate SAS token with read/write/list permissions

#### **Configuration Steps**
```
1. Open Settings → Data Management
2. Tap "Azure Backup & Restore"
3. Enter your Azure configuration:
   - Storage Account Name: youraccount
   - Container Name: backups (or custom name)
   - SAS Token: sv=2020-08-04&ss=... (from Azure Portal)

4. Tap "Test Connection" to verify setup
5. Configuration automatically saved on success
```

#### **Generating SAS Token**
```
Azure Portal Steps:
1. Navigate to your Storage Account
2. Go to "Shared access signature" in left menu
3. Configure permissions:
   ✅ Service: Blob
   ✅ Resource: Container and Object  
   ✅ Permissions: Read, Write, List, Create, Delete
   ✅ Start/End dates: Set appropriate expiration
4. Click "Generate SAS and connection string"
5. Copy the "SAS token" (starts with sv=...)
```

### 📤 Creating Azure Backups

#### **Manual Backup Process**
```
1. Open Azure Backup interface
2. Ensure connection status shows "Connected"
3. Tap "Create Backup"
4. Enter PIN if encryption is enabled (automatic prompt)
5. Confirm backup creation
6. Monitor progress bar (typically 30-60 seconds)
7. Backup appears in backup list with timestamp and encryption status
```

#### **Backup Contents**
```
Complete Data Export:
✅ All friends and their profiles
✅ All encounters with ratings and details
✅ All interaction types and settings
✅ Security settings (PIN/biometric preferences)
✅ Scoring algorithm weights
✅ App preferences and configurations

Security Features:
✅ AES-256-GCM encryption (when PIN protection enabled)
✅ Client-side encryption before upload
✅ PBKDF2 key derivation with 100,000 iterations
✅ Unique salt and IV per backup
✅ Data compressed to minimize upload time
✅ File integrity verification included
```

#### **Automatic Backup (Optional)**
```
Auto-Backup Features:
- Trigger: Automatically backup when you add/edit data
- Container: Separate "auto-backups" container
- Retention: Keep last 10 backups (configurable 1-100)
- Speed: Data-only (no photos) for faster uploads
- Privacy: Same encryption as manual backups

Enable in Settings:
Settings → Azure Backup → Enable Auto Backup toggle
```

### 📥 Restoring from Azure Backup

#### **Restoration Process**
```
1. Open Azure Backup interface
2. Select backup from list (shows date/time and encryption status)
3. Tap "Restore" button
4. Enter PIN if backup is encrypted (automatic prompt)
5. CONFIRM: This replaces ALL current data
6. Monitor progress (typically 60-120 seconds)
7. App refresh required after restoration
```

#### **⚠️ Important Notes**
```
Data Replacement:
❌ Restoration REPLACES all current data
❌ Cannot be undone once started
❌ Create current backup before restoring old one

Best Practices:
✅ Export current data first (as safety backup)
✅ Verify backup date is correct before restoring
✅ Close other apps during restoration
✅ Ensure stable internet connection
```

### 🗑️ Backup Management

#### **Deleting Old Backups**
```
Manual Cleanup:
1. Select backup from list
2. Tap "Delete" button  
3. Confirm permanent deletion
4. Backup removed from Azure and list

Automatic Cleanup (Auto-Backup):
- Oldest backups automatically deleted
- Maintains configured retention count
- Manual backups not affected by auto-cleanup
```

#### **Configuration Export/Import**
```
Backup Your Settings:
- Export: Creates azure-backup-config-YYYY-MM-DD.json
- Import: Restore settings from exported file
- Useful for: Setting up multiple devices
- Contains: Account name, container, tokens (if saved)
```

---

## 📂 Local Export (JSON Files)

### 💾 Manual Data Export

For complete data ownership and offline backup, you can export all your data as a JSON file stored locally on your device.

#### **Export Process**
```
iPhone/iPad Steps:
1. Settings → Data Management
2. Tap "Export Data" (or "Share Data" on iOS)
3. Enter PIN if encryption is enabled (automatic prompt)
4. Choose export location:
   - Files App → iCloud Drive (recommended)
   - Files App → On My iPhone
   - Share to other apps (AirDrop, email, etc.)

File Details:
📄 Format: JSON (JavaScript Object Notation)
📅 Filename: the-load-down-backup-YYYY-MM-DD-[encrypted].json
💾 Size: Typically 50KB - 5MB depending on data volume
🔧 Readable: Plain JSON or encrypted format (based on PIN settings)
🔒 Security: Encrypted with AES-256-GCM when PIN protection enabled
```

#### **Export Contents**
```
Complete Data Snapshot:
✅ friends: All friend profiles with photos
✅ encounters: All encounters with ratings and details  
✅ interactionTypes: All 128 activity types
✅ settings: App preferences and configurations
✅ version: Export format version for compatibility
✅ exportDate: ISO timestamp of export creation

Metadata Included:
✅ Export version for future compatibility
✅ Creation timestamp for organization
✅ Data structure version for validation
```

### 📥 Importing JSON Data

#### **Import Process**
```
1. Settings → Data Management
2. Tap "Import Data"
3. Select JSON backup file from:
   - Files App (iCloud Drive, local storage)
   - Other apps via Share Sheet
4. Enter PIN if backup is encrypted (automatic detection)
5. Choose import mode:
   - Replace: Delete all data, import backup
   - Merge: Add backup data to existing data
6. Confirm operation and wait for completion
7. App refresh required after import
```

#### **Import Modes**
```
Replace Mode (Destructive):
❌ Deletes ALL existing data first
✅ Perfect copy of backup data
✅ Recommended for device migration
⚠️ Cannot be undone

Merge Mode (Additive):  
✅ Keeps existing data
✅ Adds backup data alongside current data
⚠️ May create duplicates if importing same data twice
✅ Good for combining data from multiple sources
```

#### **Import Validation**
```
File Format Checks:
✅ Valid JSON structure required
✅ Required fields validation (friends, encounters, etc.)
✅ Data type verification (dates, numbers, etc.)
✅ Compatibility check with current app version

Error Handling:
❌ Invalid files rejected with explanation
❌ Partial imports not allowed (all-or-nothing)
✅ Detailed error messages for troubleshooting
✅ Original data preserved if import fails
```

---

## 📊 Backup Comparison

### ☁️ Azure vs 📂 Local JSON

| Feature | Azure Backup | Local JSON Export |
|---------|--------------|-------------------|
| **Storage Location** | Microsoft Cloud | Your Device/iCloud |
| **Encryption** | ✅ AES-256 (PIN-based) | ✅ AES-256 (PIN-based) |
| **Automatic Backups** | ✅ Configurable | ❌ Manual only |
| **Version Management** | ✅ Multiple backups | ❌ Single file |
| **Cross-Device Access** | ✅ From anywhere | ❌ Device-specific |
| **Internet Required** | ✅ Yes | ❌ No |
| **Setup Complexity** | 🟡 Medium | 🟢 Simple |
| **Data Portability** | 🟡 Requires Azure | ✅ Universal JSON |
| **Privacy** | 🟡 Microsoft servers | ✅ Your control |
| **Cost** | 🟢 Free tier available | 🟢 Free |
| **Decryption Tools** | ✅ App built-in | ✅ External script available |

### 🎯 Recommendation

**Use Both for Maximum Protection:**
- **Azure Backup**: Primary protection with automatic features
- **JSON Export**: Quarterly manual exports for complete data ownership
- **Best Practice**: Azure for convenience, JSON for long-term archival

---

## 🔄 Device Migration Workflows

### 📱 Moving to New Device

#### **Complete Migration Process**
```
Preparation (Old Device):
1. Create fresh Azure backup
2. Export JSON backup to iCloud Drive
3. Verify both backups completed successfully
4. Note down Azure configuration details

Setup (New Device):
1. Install The Load Down app
2. Complete initial security setup (PIN/biometric)
3. Choose restoration method:
   
   Option A - Azure Restore:
   - Configure Azure backup with same settings
   - Test connection
   - Select most recent backup
   - Restore all data
   
   Option B - JSON Import:
   - Import JSON file from iCloud Drive
   - Choose "Replace" mode for clean import
   - Verify all data imported correctly

Verification:
✅ Check friend count matches
✅ Verify recent encounters are present
✅ Test analytics and scoring
✅ Confirm settings preserved
```

#### **Partial Migration (Selected Data)**
```
When You Want to Start Fresh:
1. Export current data as JSON
2. Set up new device with clean install
3. Manually recreate essential friends
4. Reference JSON export for encounter history
5. Import specific encounters if needed using merge mode
```

### 🔧 Data Cleanup Before Migration

#### **Optimization Steps**
```
Review Before Backup:
1. Archive or delete inactive friends
2. Remove test/sample encounters
3. Clean up duplicate entries
4. Verify all ratings are accurate
5. Update friend profiles with current info

Benefits:
✅ Smaller backup files
✅ Faster transfer process
✅ Cleaner analytics on new device
✅ Better app performance
```

---

## 🆘 Recovery Scenarios

### 📱 Device Loss/Damage

#### **Azure Recovery**
```
If You Have Azure Backup:
1. Install app on new/replacement device
2. Set up security (new PIN/biometric)
3. Configure Azure backup with saved settings
4. Restore from most recent backup
5. Resume normal usage within minutes

Recovery Time: 5-10 minutes
Data Loss: Minimal (last backup to incident)
```

#### **JSON Recovery**
```
If You Have JSON Export:
1. Install app on new device
2. Access JSON file from iCloud Drive or backup
3. Import using "Replace" mode
4. Manual security setup required

Recovery Time: 10-15 minutes  
Data Loss: Up to last export (could be weeks/months)
```

### 🐛 App Issues/Corruption

#### **Data Corruption Recovery**
```
Signs of Corruption:
- App crashes frequently
- Missing friends or encounters
- Analytics showing impossible data
- Import/export failures

Recovery Steps:
1. Stop using app immediately (prevent further corruption)
2. Try latest Azure backup restore
3. If Azure fails, use JSON import
4. If both fail, reinstall app and import last known good backup
5. Contact support if persistent issues
```

### ⚠️ Emergency Data Access

#### **When You Need Data Urgently**
```
Quick Access Methods:
1. Azure restore on any device with internet
2. JSON file accessible via any device with Files app
3. Email yourself recent JSON export for universal access
4. Share JSON with trusted friend as emergency backup

Preparation Tips:
✅ Keep recent JSON export in easily accessible location
✅ Save Azure configuration details securely
✅ Test restore process before you need it
✅ Consider sharing emergency backup with trusted person
```

---

## 🔒 Security & Privacy

### 🛡️ Backup Security

#### **Azure Security Features**
```
Data Protection:
🔐 AES-256 encryption before upload
🔑 Encryption keys stored locally (not in cloud)
🌐 HTTPS/TLS transport encryption
🏢 Microsoft enterprise security infrastructure
📍 Data residency in your selected Azure region
```

#### **JSON Security Considerations**
```
Local Storage:
✅ Stored in app sandbox (iOS security)
🔒 AES-256 encryption (when PIN protection enabled)
✅ Subject to device-level encryption (if enabled)
✅ iCloud encryption (if stored there)

Best Practices:
🔒 Enable device screen lock/passcode
🔒 Use device encryption features
🔒 Store in secure cloud services (iCloud, etc.)
🔒 Use external decryption tools for encrypted backups
❌ Avoid emailing or sharing via unsecured methods
```

### 👀 Privacy Considerations

#### **What's Included in Backups**
```
Personal Data:
✅ Friend names and details
✅ Encounter descriptions and ratings
✅ Location data (if entered)
✅ Personal preferences and settings
✅ Any notes or custom tags

Sensitive Data:
✅ Sexual activity records
✅ Health/safety information
✅ Financial details (if tracked)
✅ Contact information
✅ Photos (if uploaded)
```

#### **Sharing Recommendations**
```
Never Share Backups Containing:
❌ Other people's personal information
❌ Intimate encounter details
❌ Private conversations or notes
❌ Health status information
❌ Financial transaction details

OK to Share:
✅ Your own statistical summaries
✅ Anonymous analytics insights
✅ General usage patterns (no personal details)
✅ App screenshots with data redacted
```

---

*Next: [Data Import & Export](Data-Import-Export) • Previous: [Interaction Types](Interaction-Types)*