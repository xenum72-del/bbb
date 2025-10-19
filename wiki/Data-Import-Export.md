# 📁 Data Import & Export - Complete File Management Guide

> **Master all import/export formats and data portability options for The Load Down**

---

## 🎯 Overview: Your Data, Your Control

The Load Down provides comprehensive data portability through multiple import and export formats. Whether you're migrating devices, creating backups, or sharing selected data, you have complete control over your information.

**Core Philosophy:**
- **🔓 Open Data**: No vendor lock-in - your data in standard formats
- **📂 Multiple Formats**: JSON, CSV, and cloud-native options
- **🔄 Bidirectional**: Import and export in the same formats
- **🛡️ Privacy First**: You control what data leaves the app
- **📱 Cross-Platform**: Standard formats work everywhere

---

## 📋 Supported Formats

### 🔧 JSON (Primary Format)

#### **Why JSON?**
```
✅ Complete Data: All fields, relationships, metadata preserved
✅ Universal: Readable by any programming language or tool
✅ Structured: Maintains data relationships and hierarchy
✅ Future-Proof: Standard format that won't become obsolete
✅ Developer-Friendly: Easy to parse, modify, or integrate
```

#### **JSON Export Contents**
```json
{
  "version": "1.0",
  "exportDate": "2025-10-18T10:30:00.000Z",
  "data": {
    "friends": [
      {
        "id": 1,
        "name": "Alex Johnson",
        "age": 28,
        "location": "San Francisco, CA",
        "createdAt": "2024-01-15T09:00:00.000Z",
        "sexualRole": "Versatile",
        "bodyType": "Athletic",
        "overallRating": 5,
        "tags": ["funny", "adventurous"]
      }
    ],
    "encounters": [
      {
        "id": 1,
        "date": "2024-10-17T20:00:00.000Z",
        "rating": 5,
        "participants": [1],
        "typeId": 3,
        "durationMinutes": 120,
        "notes": "Amazing evening, great chemistry",
        "beneficiary": "both"
      }
    ],
    "interactionTypes": [...],
    "settings": [...]
  }
}
```

#### **JSON Import Options**
```
Import Modes:
1. Replace All: Delete existing data, import backup (recommended for migration)
2. Merge: Add imported data to existing data (for combining datasets)

Validation:
✅ JSON structure validation
✅ Required field verification
✅ Data type checking (dates, numbers, arrays)
✅ Referential integrity (encounters must reference valid friends)
✅ Compatible version checking
```

### 📊 CSV (Spreadsheet-Compatible)

#### **CSV Export Options**
The app can export data to CSV format for analysis in Excel, Google Sheets, or other spreadsheet applications.

#### **Available CSV Exports**
```
Friends Export (friends.csv):
- ID, Name, Age, Location, Body Type, Sexual Role
- Overall Rating, Sex Rating, Personality Rating
- Creation Date, Last Updated, Tags
- Contact info, Health status, Relationship status

Encounters Export (encounters.csv):
- ID, Date, Rating, Duration Minutes, Location
- Participant IDs, Activity Type, Beneficiary
- Notes, Tags, Sexual details
- Creation Date, Payment info (if applicable)

Analytics Export (analytics.csv):
- Friend ID, Friend Name, Score, Encounter Count
- Average Rating, Last Seen Date
- Frequency Score, Recency Score, Quality Score
```

#### **CSV Import Capabilities**
```
Supported Imports:
✅ Friends CSV: Basic friend information
✅ Encounters CSV: Encounter data with references
✅ Custom CSV: User-defined field mapping

Requirements:
- Header row with field names
- Proper date formatting (ISO 8601)
- Valid foreign key references
- UTF-8 encoding for international characters
```

### 🗂️ Specialized Formats

#### **vCard Export (.vcf)**
```
Friend Contact Export:
- Export friend contact info as vCard files
- Compatible with Contacts app, Outlook, Gmail
- Includes: Name, phone, email, notes
- Batch export or individual friend export
- Excludes: Intimate details for privacy
```

#### **Calendar Export (.ics)**
```
Encounter Timeline Export:
- Export encounters as calendar events
- Compatible with Calendar app, Google Calendar, Outlook
- Includes: Date, duration, basic activity type
- Privacy mode: Generic event names for discretion
- Filter by date range, friend, or activity type
```

---

## 📤 Export Procedures

### 🔧 Complete JSON Export

#### **Step-by-Step Process**
```
1. Open Settings → Data Management
2. Tap "Export Data"
3. Choose export scope:
   □ All Data (complete backup)
   □ Friends Only
   □ Encounters Only
   □ Settings Only

4. Select destination:
   - Files App → iCloud Drive (recommended)
   - Files App → On My iPhone/iPad
   - Share to other apps (email, AirDrop, etc.)

5. File automatically named: the-load-down-backup-YYYY-MM-DD.json
6. Confirm export completion
```

#### **Export Customization**
```
Privacy Filters:
□ Exclude photos (faster, more private)
□ Exclude notes (remove personal comments)
□ Exclude health info (remove HIV status, test dates)
□ Exclude financial data (remove payment information)
□ Date range filter (export only recent data)

Data Subsets:
□ Specific friends only
□ Encounters above certain rating
□ Particular activity types
□ Custom date ranges
```

### 📊 CSV Export Process

#### **Spreadsheet Export**
```
1. Settings → Data Management → Export Data
2. Choose "CSV Format"
3. Select tables to export:
   □ Friends Table
   □ Encounters Table
   □ Analytics Summary
   □ All Tables (separate files)

4. Configure CSV options:
   - Delimiter: Comma (,) or Semicolon (;)
   - Encoding: UTF-8 (recommended) or ASCII
   - Date format: ISO 8601 or local format
   - Include headers: Yes (recommended)

5. Files created as .zip containing:
   - friends.csv
   - encounters.csv
   - analytics.csv
   - metadata.txt (export details)
```

### 🗂️ Specialized Exports

#### **Contact Export (vCard)**
```
1. Friends page → Select friends to export
2. Tap share icon → "Export as vCard"
3. Choose fields to include:
   □ Basic info (name, age)
   □ Contact details (phone, email, social)
   □ Physical details (optional, privacy concern)
   □ Custom notes field

4. Export as:
   - Single .vcf file (all contacts)
   - Individual .vcf files (one per friend)
   - Share directly to Contacts app
```

#### **Calendar Export (iCal)**
```
1. Timeline page → Filter encounters to export
2. Tap export icon → "Export as Calendar"
3. Privacy settings:
   □ Generic event names ("Social Event")
   □ Activity-specific names ("Coffee Date")
   □ Full details (not recommended)

4. Date range and filters:
   - Last 30/90/365 days
   - Specific friend encounters
   - Minimum rating threshold
   - Activity type filters
```

---

## 📥 Import Procedures

### 🔧 JSON Import Process

#### **Complete Data Import**
```
1. Settings → Data Management → Import Data
2. Tap "Select File" → Choose JSON backup
3. File validation and preview:
   - Shows: Import summary (X friends, Y encounters)
   - Validates: File structure, required fields
   - Warns: Data conflicts, version issues

4. Choose import mode:
   □ Replace All Data (destructive - for migrations)
   □ Merge with Existing (additive - for combining data)

5. Confirm import and wait for completion
6. App refresh required after import
```

#### **Import Validation & Errors**
```
Validation Checks:
✅ Valid JSON syntax
✅ Required fields present (friends need name, encounters need date)
✅ Proper data types (dates as ISO strings, ratings as numbers)
✅ Foreign key integrity (encounters reference valid friends)
✅ Reasonable value ranges (ratings 1-5, valid dates)

Common Errors:
❌ "Invalid JSON": Corrupted or non-JSON file
❌ "Missing required fields": Essential data missing
❌ "Invalid date format": Dates not in ISO 8601 format
❌ "Unknown friend ID": Encounter references non-existent friend
❌ "Version mismatch": Backup from incompatible app version

Error Resolution:
🔧 Manual JSON editing for data scientists
🔧 Partial import tools for specific issues
🔧 Format conversion utilities
🔧 Support contact for complex problems
```

### 📊 CSV Import Process

#### **Spreadsheet Data Import**
```
1. Prepare CSV files with required headers
2. Settings → Data Management → Import CSV
3. Select CSV file(s) to import
4. Map columns to fields:
   - Auto-detection for standard names
   - Manual mapping for custom formats
   - Preview first 5 rows for verification

5. Configure import options:
   □ Skip duplicate detection
   □ Update existing records
   □ Date format specification
   □ Character encoding

6. Import validation and execution
7. Review import summary and any errors
```

#### **CSV Format Requirements**
```
Friends CSV Format:
Required: name
Optional: age, location, bodyType, sexualRole, overallRating, tags, notes

Example:
name,age,location,bodyType,sexualRole,overallRating,tags
"Alex Johnson",28,"San Francisco","Athletic","Versatile",5,"funny,adventurous"

Encounters CSV Format:
Required: date, rating, participants, typeId
Optional: durationMinutes, location, notes, beneficiary

Example:
date,rating,participants,typeId,durationMinutes,notes
"2024-10-17T20:00:00.000Z",5,"1",3,120,"Great evening"
```

### 🗂️ Specialized Imports

#### **Contact Import (vCard)**
```
1. Export contacts from other apps as .vcf
2. Import via Friends page → "Import Contacts"
3. Field mapping options:
   - Name → Friend name
   - Phone → Contact info
   - Notes → Friend notes
   - Custom fields → Tags or notes

4. Privacy filtering:
   □ Import basic info only
   □ Exclude sensitive fields
   □ Review before importing
```

#### **Calendar Import (iCal)**
```
Limited Support:
- Can import basic encounter timing from calendar events
- Manual review required for data quality
- Best for: Reconstructing timeline from external calendar
- Use case: Recovery from other relationship tracking apps
```

---

## 🔄 Data Migration Scenarios

### 📱 Device Upgrade/Replacement

#### **Complete Migration**
```
Old Device:
1. Create comprehensive JSON export
2. Store in iCloud Drive or email to yourself
3. Verify export includes all data

New Device:
1. Install The Load Down
2. Complete initial setup (security settings)
3. Import JSON using "Replace All" mode
4. Verify data transfer completion
5. Set up new Azure backup configuration

Timeline: 10-15 minutes
Data Loss: None (if exported correctly)
```

#### **Selective Migration**
```
When You Want Fresh Start:
1. Export friends as CSV for reference
2. Export high-rated encounters only
3. Set up new device with clean install
4. Manually recreate important friends
5. Import selected encounters using merge mode

Benefits: Clean data, better performance
Downside: Manual work required
```

### 🔧 App Reinstallation

#### **After App Issues**
```
Preparation:
1. Export complete JSON backup
2. Export CSV files as secondary backup
3. Document current settings/preferences

Reinstallation:
1. Delete and reinstall app
2. Complete fresh setup
3. Import JSON backup
4. Verify all data restored
5. Reconfigure preferences if needed
```

### 📊 Data Analysis Projects

#### **External Analysis Setup**
```
For Researchers/Data Scientists:
1. Export anonymized CSV data
2. Remove personally identifiable information
3. Import into analysis tools:
   - Excel/Google Sheets: Basic statistics
   - R/Python: Advanced analytics
   - Tableau/Power BI: Visualizations
   - SPSS: Statistical analysis

Privacy Notes:
⚠️ Remove names, locations, identifying details
⚠️ Aggregate data for population-level insights
⚠️ Ensure compliance with privacy laws
```

### 🔗 Integration with Other Apps

#### **CRM Integration**
```
Export to Customer Relationship Management:
1. Export friends as vCard files
2. Import into CRM system
3. Maintain relationship timeline externally
4. Sync updates back via CSV import

Use Cases:
- Business networking
- Professional relationship tracking
- Integration with existing workflows
```

#### **Health App Integration**
```
Export for Health Analysis:
1. Export encounter frequency data
2. Correlate with fitness/mood data
3. Anonymize for health research
4. Import insights back as friend notes

Privacy: Remove all identifying information
```

---

## 🛡️ Privacy & Security

### 🔒 Export Security

#### **Data Protection During Export**
```
Local Storage:
✅ Files encrypted by iOS file system
✅ Stored in app sandbox (isolated)
✅ Removed after sharing (temporary only)

Cloud Storage:
✅ iCloud Drive: Encrypted in transit and at rest
⚠️ Email: Plain text (not recommended for sensitive data)
⚠️ File sharing: Depends on chosen service

Recommendations:
🔒 Use iCloud Drive for temporary storage
🔒 Delete exports after successful import
🔒 Avoid email for complete data exports
🔒 Use secure sharing for trusted recipients only
```

### 👀 Privacy Considerations

#### **What to Share vs. Keep Private**
```
OK to Share (Anonymized):
✅ Statistical summaries
✅ Trend analysis
✅ App feature usage
✅ General relationship patterns

Never Share:
❌ Friend names or identifying information
❌ Specific encounter details
❌ Location information
❌ Health status data
❌ Financial information
❌ Personal notes or comments

Semi-Private (Trusted Researchers Only):
🟡 Anonymized encounter patterns
🟡 Demographic trends (no individual data)
🟡 App usage statistics
🟡 General satisfaction metrics
```

#### **Legal Compliance**
```
GDPR Compliance (EU Users):
✅ Data portability right fulfilled
✅ Right to export personal data
✅ Right to delete (via clear data function)
✅ Data processor agreements (Azure backup)

CCPA Compliance (CA Users):
✅ Consumer right to know data collected
✅ Consumer right to delete personal information
✅ Consumer right to opt-out (analytics settings)
✅ Non-discrimination for privacy choices
```

### 🔐 Import Security

#### **Validating Import Sources**
```
Trusted Sources:
✅ Your own previous exports
✅ Official app migration tools
✅ Verified backup files with known provenance

Untrusted Sources:
❌ Files from unknown origins
❌ Modified JSON with suspicious data
❌ Exports from unofficial tools
❌ Files shared by untrusted parties

Validation Steps:
🔍 Check file modification dates
🔍 Verify data ranges are reasonable
🔍 Review friend/encounter counts
🔍 Scan for suspicious entries before import
```

---

## 🔧 Advanced Data Management

### 🗄️ Archival Strategies

#### **Long-Term Data Preservation**
```
Recommended Approach:
1. Quarterly JSON exports to long-term storage
2. Annual CSV exports for analysis
3. Cloud backup for active data protection
4. Local archive for complete data ownership

Storage Recommendations:
🗄️ External drive: Long-term offline storage
☁️ Cloud storage: Encrypted and replicated
💾 USB drive: Physical backup for catastrophic scenarios
📀 Optical media: Ultra-long-term archival (10+ years)
```

#### **Data Lifecycle Management**
```
Active Data (Current Year):
- Full detail in app
- Real-time analytics
- Complete interaction history

Archive Data (1-3 Years):
- JSON exports with full detail
- CSV summaries for analysis
- Photos stored separately

Historical Data (3+ Years):
- Aggregate statistics only
- Key relationship insights preserved
- Individual encounters may be summarized
```

### 📊 Data Quality Management

#### **Pre-Export Cleanup**
```
Data Review Checklist:
□ Remove test/sample data
□ Verify friend information is current
□ Check for duplicate encounters
□ Validate ratings consistency
□ Clean up typos in notes/names
□ Archive inactive relationships

Benefits:
✅ Smaller export files
✅ Better analytics quality
✅ Easier migration process
✅ Improved app performance
```

#### **Post-Import Validation**
```
Import Verification:
□ Friend count matches expected
□ Encounter count matches expected
□ Recent activity is present
□ Settings preserved correctly
□ Analytics data looks reasonable
□ No missing or corrupted relationships

Troubleshooting:
🔧 Compare import summary with export
🔧 Check for version compatibility issues
🔧 Verify all referenced data imported
🔧 Re-run import if discrepancies found
```

---

*Next: [Anonymous Analytics](Anonymous-Analytics) • Previous: [Backup & Export](Backup-Export)*