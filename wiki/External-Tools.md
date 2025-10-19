# 🔧 External Tools & Utilities

> **Command-line tools and utilities for advanced backup management and data analysis**

---

## 🎯 Overview

The Load Down includes several external tools for advanced users who need command-line access to backup data, debugging capabilities, or external data processing. These tools complement the built-in app features and provide additional flexibility for power users.

**Available Tools:**
- **🔓 Backup Decryption Script**: Decrypt encrypted backups outside the app
- **📊 Data Analysis Utilities**: Debug and analyze encounter data
- **🛠️ Development Tools**: Data integrity testing and validation

---

## 🔓 Backup Decryption Script

### decrypt-backup.sh

A comprehensive bash script that can decrypt encrypted backup files created by The Load Down app, allowing you to access your data outside the app environment.

#### **Features**
```
🔐 AES-256-GCM Decryption: Full compatibility with app encryption
🔑 PIN-Based Key Derivation: PBKDF2 with 100,000 iterations
✅ Input Validation: Comprehensive file format checking
🎨 Color-Coded Output: User-friendly terminal interface
🛡️ Error Handling: Detailed troubleshooting guidance
🧹 Automatic Cleanup: Temporary files safely removed
```

#### **Prerequisites**
```bash
# Required software (install via package manager)
brew install jq       # JSON processing
brew install node     # Node.js runtime for crypto operations

# OR on Ubuntu/Debian
sudo apt install jq nodejs

# OR on Windows (WSL)
sudo apt update && sudo apt install jq nodejs
```

#### **Usage**
```bash
# Basic usage
./decrypt-backup.sh my-backup-encrypted.json

# Example with full path
./decrypt-backup.sh ~/Downloads/the-load-down-backup-2025-01-15-encrypted.json
```

#### **Interactive Process**
```
🔐 BBB Backup Decryption Tool

📖 Reading encrypted data...
Enter PIN to decrypt backup: ****

🔄 Decrypting...
✅ Decryption successful!
📄 Decrypted backup saved to: my-backup-encrypted-decrypted.json

You can now view the decrypted backup data:
  cat 'my-backup-encrypted-decrypted.json'
  jq . 'my-backup-encrypted-decrypted.json'
```

#### **Error Handling**
```
Common Errors:
❌ Incorrect PIN - authentication failed
❌ File is not encrypted
❌ Missing encryption fields
❌ Corrupted backup file
❌ Missing required software (jq, node)

Troubleshooting:
• Check PIN carefully (no caps lock, correct numbers)
• Verify file wasn't modified or truncated
• Ensure jq and Node.js are installed
• Try downloading backup file again
```

#### **Security Notes**
```
🔒 Security Features:
✅ PIN never stored or logged
✅ Temporary files securely deleted
✅ No network connections required
✅ Uses same encryption as app

⚠️ Security Considerations:
• Decrypted files are plain text - handle carefully
• Delete decrypted files after use
• Don't share decrypted files containing personal data
• Use in private/secure environment only
```

---

## 📊 Data Analysis Utilities

### analyze_marathon.js

A Node.js script for debugging and analyzing specific activity data, particularly useful for troubleshooting counting discrepancies or data validation issues.

#### **Purpose**
Originally created to debug the "Marathon (3+ hrs)" activity counting issue, this script demonstrates how to:
- Parse backup JSON files
- Count activity usage across encounters
- Identify data inconsistencies
- Validate analytics calculations

#### **Usage**
```bash
# Analyze a backup file
node analyze_marathon.js

# Script automatically looks for backup in Downloads folder
# Modify path in script for different locations
```

#### **Output Example**
```
Analyzing Marathon (3+ hrs) usage...

Marathon interaction type: { id: 45, name: 'Marathon (3+ hrs)', ... }

As Main Activity: 21
In Activities Performed: 20
Appears in Both: 0

Total appearances: 41
Unique encounters: 41

For comparison - Marathon Session:
As Main: 15
In Activities: 12
```

#### **Customization**
```javascript
// Modify script to analyze different activities
const targetActivity = 'Your Activity Name';

// Change backup file path
const backupPath = '/path/to/your/backup.json';

// Add custom analysis logic
// Count by date, friend, rating, etc.
```

---

## 🛠️ Development Tools

### Data Integrity Testing

Built-in console functions available in the app's developer mode for data validation and integrity checking.

#### **Available Functions**
```javascript
// Fix orphaned sample data references
validateSampleDataIntegrity()

// Create test data for development
createTestDataOnly()

// Run full data integrity tests
runDataIntegrityTests()       // Cleans up after testing
runDataIntegrityTests(true)   // Keeps test data
```

#### **Usage in Browser Console**
```javascript
// Open developer console in browser (F12)
// These functions are automatically loaded in developer mode

// Check and fix sample data issues
await validateSampleDataIntegrity();

// Generate test data for development
await createTestDataOnly();

// Run comprehensive tests
await runDataIntegrityTests();
```

#### **Developer Mode Access**
```
Activation:
1. Go to Settings page
2. Tap "Settings" title 7 times quickly (within 3 seconds)
3. Developer mode activated message appears
4. Additional developer tools become visible
5. Console functions automatically loaded
```

---

## 🚀 Installation & Setup

### Setting Up External Tools

#### **1. Download Tools**
```bash
# Clone repository or download individual files
git clone https://github.com/xenum72-del/bbb.git
cd bbb

# Or download specific files:
curl -O https://raw.githubusercontent.com/xenum72-del/bbb/main/decrypt-backup.sh
curl -O https://raw.githubusercontent.com/xenum72-del/bbb/main/analyze_marathon.js
```

#### **2. Make Scripts Executable**
```bash
# Make decrypt script executable
chmod +x decrypt-backup.sh

# Verify permissions
ls -la decrypt-backup.sh
# Should show: -rwxr-xr-x ... decrypt-backup.sh
```

#### **3. Install Dependencies**
```bash
# macOS (using Homebrew)
brew install jq node

# Ubuntu/Debian
sudo apt update
sudo apt install jq nodejs npm

# Verify installations
jq --version      # Should show version number
node --version    # Should show version number
```

#### **4. Test Installation**
```bash
# Test with help option
./decrypt-backup.sh

# Should show usage information
```

---

## 📋 Usage Examples

### Decrypt and Analyze Workflow

#### **Complete Analysis Workflow**
```bash
# 1. Decrypt encrypted backup
./decrypt-backup.sh my-backup-encrypted.json

# 2. Analyze decrypted data with jq
jq '.friends | length' my-backup-encrypted-decrypted.json
jq '.encounters | length' my-backup-encrypted-decrypted.json

# 3. Find specific activities
jq '.interactionTypes[] | select(.name | contains("Marathon"))' my-backup-encrypted-decrypted.json

# 4. Count encounters by activity
jq '.encounters | group_by(.typeId) | map({typeId: .[0].typeId, count: length})' my-backup-encrypted-decrypted.json

# 5. Export to CSV for Excel analysis
jq -r '.encounters[] | [.date, .rating, .durationMinutes] | @csv' my-backup-encrypted-decrypted.json > encounters.csv
```

#### **Data Validation Checks**
```bash
# Check for data integrity issues
jq '.encounters[] | select(.activitiesPerformed == null or .activitiesPerformed == [])' my-backup-encrypted-decrypted.json

# Find encounters with invalid dates
jq '.encounters[] | select(.date | fromdateiso8601 > now)' my-backup-encrypted-decrypted.json

# Validate friend references
jq '.encounters[] | .participants[] as $p | select(([.friends[].id] | index($p)) == null)' my-backup-encrypted-decrypted.json
```

### Custom Data Processing

#### **Extract Specific Data**
```bash
# Get all encounter notes
jq -r '.encounters[] | select(.notes != null and .notes != "") | .notes' backup-decrypted.json

# Export friend list with contact info
jq '.friends[] | {name: .name, age: .age, contacts: .socialProfiles}' backup-decrypted.json

# Calculate monthly statistics
jq '.encounters | group_by(.date[0:7]) | map({month: .[0].date[0:7], count: length, avg_rating: (map(.rating) | add / length)})' backup-decrypted.json
```

---

## 🔒 Security & Privacy

### Safe Usage Practices

#### **Handle Decrypted Data Safely**
```bash
# Use temporary directories
mkdir /tmp/analysis
cd /tmp/analysis
./decrypt-backup.sh ~/Downloads/backup.json

# Process data
# ... your analysis work ...

# Clean up thoroughly
rm -rf /tmp/analysis
```

#### **Protect Sensitive Information**
```
Before Sharing:
❌ Never share decrypted backup files
❌ Don't email plain text data
❌ Avoid cloud storage for decrypted files
❌ Don't leave decrypted files on shared computers

Safe Practices:
✅ Decrypt in private environment
✅ Delete decrypted files after use
✅ Use encrypted storage for any saved analysis
✅ Redact personal information before sharing insights
```

#### **Script Security**
```
Verify Scripts:
✅ Download from official repository only
✅ Review script content before running
✅ Verify checksums if provided
✅ Run in isolated environment if unsure

Trust Indicators:
✅ Official repository: github.com/xenum72-del/bbb
✅ Signed commits (when available)
✅ Community reviews and issues
✅ Regular updates and maintenance
```

---

## 🆘 Troubleshooting

### Common Issues

#### **Decryption Failures**
```
Problem: "Incorrect PIN - authentication failed"
Solution:
• Double-check PIN (no typos)
• Verify caps lock is off
• Try typing PIN slowly
• Ensure backup was created with current PIN

Problem: "File is not encrypted"
Solution:
• File may be unencrypted backup
• Use jq directly: jq . backup.json
• Check file format and structure

Problem: "Missing required software"
Solution:
• Install jq: brew install jq
• Install Node.js: brew install node
• Verify installations: jq --version && node --version
```

#### **Analysis Script Issues**
```
Problem: "Cannot find backup file"
Solution:
• Check file path in script
• Move backup to expected location
• Modify script path variable

Problem: "JSON parsing errors"
Solution:
• Verify backup file integrity
• Check for truncation or corruption
• Try re-downloading backup
• Use jq to validate JSON: jq . backup.json
```

#### **Permission Issues**
```
Problem: "Permission denied"
Solution:
• Make script executable: chmod +x decrypt-backup.sh
• Check file ownership: ls -la
• Run with appropriate permissions

Problem: "Command not found"
Solution:
• Install missing dependencies
• Check PATH environment variable
• Use full path to executables
```

---

## 🚀 Advanced Usage

### Custom Script Development

#### **Template for Custom Analysis**
```javascript
const fs = require('fs');

// Load backup data
const backupPath = process.argv[2] || 'backup.json';
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Your custom analysis here
console.log('Total friends:', data.friends.length);
console.log('Total encounters:', data.encounters.length);

// Example: Find most active month
const monthCounts = data.encounters.reduce((acc, enc) => {
  const month = enc.date.substring(0, 7);
  acc[month] = (acc[month] || 0) + 1;
  return acc;
}, {});

const mostActiveMonth = Object.entries(monthCounts)
  .sort(([,a], [,b]) => b - a)[0];

console.log('Most active month:', mostActiveMonth);
```

#### **Data Export Scripts**
```bash
#!/bin/bash
# Export to multiple formats

BACKUP_FILE="$1"
BASE_NAME="${BACKUP_FILE%.json}"

# Decrypt if needed
if jq -e '.encrypted == true' "$BACKUP_FILE" > /dev/null; then
    ./decrypt-backup.sh "$BACKUP_FILE"
    BACKUP_FILE="${BASE_NAME}-decrypted.json"
fi

# Export friends to CSV
jq -r '.friends[] | [.name, .age, .bodyType, (.socialProfiles.phone // "")] | @csv' "$BACKUP_FILE" > "${BASE_NAME}-friends.csv"

# Export encounters to CSV  
jq -r '.encounters[] | [.date, .rating, .durationMinutes, (.notes // "")] | @csv' "$BACKUP_FILE" > "${BASE_NAME}-encounters.csv"

echo "✅ Exported to CSV files"
```

---

*Next: [Troubleshooting](Troubleshooting) • Previous: [Developer Mode](Developer-Mode)*