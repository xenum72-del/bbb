# Encounter Ledger - Data Integrity Test Suite

## Overview

This comprehensive test suite validates all core functionalities of the Encounter Ledger PWA to ensure data integrity, proper CRUD operations, and backup/restore functionality.

## Test Coverage

### 🧪 What Gets Tested

#### 1. Friends Management (10 test friends)
- **Create Friends**: Generates 10 diverse test friends with:
  - Complete profile data (name, age, physical stats, sexual preferences)
  - Multiple photos (3 per friend using generated test images)
  - Social media profiles and contact information
  - Health status and relationship information
  - Random preferences from GAY_ACTIVITIES list
- **Edit Friends**: Updates 5 friends with modified data and validates changes
- **Data Validation**: Ensures all fields are preserved correctly in IndexedDB

#### 2. Encounters Management (20 test encounters)
- **Create Encounters**: Generates 20 diverse encounters with:
  - Random dates over the last 6 months
  - Multiple participants from test friends
  - Random activities from GAY_ACTIVITIES
  - Photos, locations, ratings, and detailed metadata
  - Payment information and duration tracking
- **Edit Encounters**: Updates 5 encounters with modified data
- **Delete Encounters**: Removes 3 encounters and validates deletion
- **Data Validation**: Ensures all encounter fields are preserved correctly

#### 3. Backup & Restore Operations
- **Create Backup**: Generates complete JSON backup with all data and photos
- **Data Clearing**: Removes all data from IndexedDB
- **Restore Data**: Imports backup and validates data integrity
- **Format Compatibility**: Tests both old nested format and new direct format

#### 4. Data Persistence Validation
- **IndexedDB Storage**: Verifies data is properly stored in browser database
- **Photo Handling**: Ensures base64 encoded images are preserved
- **Relationships**: Validates foreign key relationships between friends and encounters
- **Timestamps**: Confirms creation and update timestamps are accurate

## Running the Tests

### Method 1: Via Settings Page (Recommended)
1. Open the Encounter Ledger PWA
2. Navigate to ⚙️ **Settings**
3. Scroll to **Data Management** section
4. Click **🧪 Run Data Tests**
5. Click **🚀 Run All Tests** on the test page
6. Monitor real-time test results in the console-style display

### Method 2: Browser Console (Developer)
1. Open browser developer tools (F12)
2. Go to Console tab
3. Run: `runDataIntegrityTests()`
4. Watch detailed test output in console

### Method 3: Programmatic (Advanced)
```javascript
import { runDataIntegrityTests } from './src/tests/dataIntegrityTests';

// Run tests and get boolean result
const allTestsPassed = await runDataIntegrityTests();
console.log('Tests passed:', allTestsPassed);
```

## Test Results Interpretation

### ✅ Success Indicators
- **Green checkmarks (✅)**: Individual test steps passed
- **"All Tests Passed"**: Complete test suite success
- **Expected counts match**: Friends, encounters, photos all preserved

### ❌ Failure Indicators
- **Red X marks (❌)**: Specific test failures
- **"Some Tests Failed"**: Issues detected in test suite
- **Error messages**: Detailed failure descriptions

### 📊 Test Summary Format
```
📊 Test Summary:
✅ Passed: 45
❌ Failed: 0

⏱️ Tests completed in 8.42 seconds
```

## Data Safety

### 🛡️ Non-Destructive Testing
- Tests create temporary data that doesn't interfere with real user data
- Original user data is backed up before testing begins
- All test data is cleaned up after completion
- Original data is restored if it existed before tests

### 🔄 Rollback Protection
- Tests store original friends and encounters arrays
- If any data existed before tests, it's restored afterward
- Test creates isolated environment for validation

## Generated Test Data

### Test Friends Include:
- **Names**: Alex, Blake, Casey, Drew, Emery, Finley, Gray, Harley, Indigo, Jazz
- **Physical Stats**: Random ages (18-47), heights, weights, body types
- **Sexual Info**: Random roles, dick sizes, preferences from GAY_ACTIVITIES
- **Social Profiles**: Generated usernames for all major platforms
- **Photos**: 3 unique AI-generated colored test images per friend
- **Health Data**: Random HIV status, PrEP usage, testing dates

### Test Encounters Include:
- **Timeframe**: Random dates over last 6 months
- **Activities**: 1-5 random selections from 100+ GAY_ACTIVITIES
- **Participants**: 1-3 random friends per encounter
- **Locations**: New York, LA, Chicago with coordinates
- **Media**: 2 unique test photos per encounter
- **Ratings**: Random 1-5 star ratings
- **Payment**: 30% have random payment amounts in USD/EUR/GBP

## Technical Details

### Architecture
- **Database**: Dexie.js wrapper for IndexedDB
- **Test Framework**: Custom TypeScript test runner
- **Data Generation**: Deterministic random data with realistic patterns
- **Validation**: Field-by-field integrity checking
- **Performance**: Handles large datasets efficiently

### Browser Compatibility
- ✅ **Chrome**: Full support
- ✅ **Safari**: Full support (iOS PWA compatible)
- ✅ **Firefox**: Full support
- ✅ **Edge**: Full support

### Performance Expectations
- **10 Friends + 20 Encounters**: ~8-12 seconds
- **Backup/Restore with Photos**: ~2-3 seconds
- **Memory Usage**: <50MB during testing
- **Storage**: ~10MB temporary IndexedDB usage

## Troubleshooting

### Common Issues

#### "Failed to retrieve created friend/encounter"
- **Cause**: Database transaction conflict
- **Solution**: Refresh page and retry tests

#### "Backup format validation failed"
- **Cause**: Corrupt backup data structure
- **Solution**: Check console for detailed error messages

#### "Photos not preserved during backup/restore"
- **Cause**: Base64 encoding issue or size limits
- **Solution**: Verify browser storage quotas

#### Tests taking too long (>30 seconds)
- **Cause**: Browser performance or memory constraints
- **Solution**: Close other tabs, retry in private/incognito mode

### Debug Mode
To enable detailed logging during tests:
```javascript
// In browser console before running tests
window.DEBUG_TESTS = true;
runDataIntegrityTests();
```

## Contributing

To extend the test suite:

1. **Add new test cases** in `dataIntegrityTests.ts`
2. **Update test data generators** for new fields
3. **Add validation functions** for new data structures
4. **Update this documentation** with new test coverage

---

## Results Example

```
🚀 Starting comprehensive data integrity tests...
🧹 Clearing any existing test data...
Test environment prepared
👥 Testing friends operations (10 friends)...
✅ Created 10 friends successfully
Friend #1 updated and validated
Friend #2 updated and validated
Friend #3 updated and validated
Friend #4 updated and validated
Friend #5 updated and validated
🔥 Testing encounters operations (20 encounters)...
✅ Created 20 encounters successfully
Encounter #1 updated and validated
Encounter #2 updated and validated
Encounter #3 updated and validated
Encounter #4 updated and validated
Encounter #5 updated and validated
Encounter #88 deleted successfully
Encounter #89 deleted successfully
Encounter #90 deleted successfully
💾 Testing backup and restore operations...
Backup created with 10 friends and 17 encounters
✅ Backup and restore operations completed successfully
🗑️ Testing data clearing operations...
✅ Data clearing operations completed successfully
Original data restored after testing

📊 Test Summary:
✅ Passed: 47
❌ Failed: 0

⏱️ Tests completed in 8.42 seconds
```

This comprehensive test suite ensures your Encounter Ledger data is rock-solid! 🎯