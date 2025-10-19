# 🛠️ Troubleshooting Guide - Common Issues & Solutions

> **Complete troubleshooting guide for resolving issues with The Load Down**

---

## 🚨 Emergency Quick Fixes

### App Won't Open or Crashes Immediately

#### **Symptoms**: App crashes on launch, white screen, or immediate closure
#### **Quick Solutions**:
1. **Force close and reopen**: Double-tap home button (iOS) or recent apps, swipe up on The Load Down
2. **Restart device**: Turn device completely off and on again
3. **Clear Safari cache**: Settings → Safari → Clear History and Website Data
4. **Reinstall app**: Delete from home screen and reinstall from original URL

#### **Advanced Solutions**:
- **Check storage space**: Ensure at least 1GB free space
- **Update iOS**: Make sure you're on iOS 14+ for best compatibility
- **Reset network settings**: Settings → General → Reset → Reset Network Settings

---

## 📱 Installation & Setup Issues

### "Add to Home Screen" Not Available

#### **Problem**: Can't find "Add to Home Screen" option in Safari
#### **Solutions**:
1. **Use Safari only**: Other browsers (Chrome, Firefox) have limited PWA support
2. **Wait for full load**: Let page completely load before trying to install
3. **Check URL**: Make sure you're on the correct app URL
4. **Try private browsing**: Open in private tab first, then try regular Safari

#### **Step-by-Step Fix**:
```
1. Open Safari (not Chrome/Firefox)
2. Go to the app URL
3. Wait 10-15 seconds for complete loading
4. Tap Share button (□↑)
5. Scroll down to find "Add to Home Screen"
6. If not there, refresh page and wait longer
```

### App Installed But Won't Work Offline

#### **Problem**: App requires internet after installation
#### **Solutions**:
1. **Initial cache load**: Launch app while connected to WiFi for 60+ seconds
2. **Allow full resource download**: Let app completely load all assets
3. **Background app refresh**: Enable in iOS Settings → The Load Down
4. **Reinstall with better connection**: Delete and reinstall on strong WiFi

### Face ID/Touch ID Not Working

#### **Problem**: Biometric authentication fails or not prompted
#### **Solutions**:
1. **Check iOS settings**: Settings → Face ID & Passcode → Safari → Enable
2. **Reset biometrics**: Disable and re-enable Face ID in The Load Down settings
3. **Clean sensors**: Clean camera (Face ID) or home button (Touch ID)
4. **Try different lighting**: Face ID needs good lighting conditions
5. **Use PIN backup**: Access app with PIN while troubleshooting biometrics

---

## 💾 Data & Storage Issues

### Data Not Saving

#### **Problem**: Encounters, friends, or settings not being saved
#### **Solutions**:
1. **Check storage space**: Ensure device has sufficient free space (1GB+)
2. **Allow storage permissions**: Check browser/app has storage permissions
3. **Avoid private browsing**: Private/incognito mode doesn't save data
4. **Complete form submission**: Ensure you tap "Save" buttons fully

#### **Verification Steps**:
```
1. Add test encounter
2. Navigate away from page
3. Return to check if encounter appears
4. If missing, follow solutions above
```

### Data Disappeared

#### **Problem**: All data suddenly missing or app appears empty
#### **Solutions**:
1. **Check filters**: Clear any search terms or date filters
2. **Verify correct app**: Ensure you're in the right app installation
3. **Restore from backup**: Use Azure backup or JSON export to restore
4. **Browser data clearing**: Check if someone cleared browser data

#### **Recovery Steps**:
```
1. Check if backup exists (Settings → Azure Backup)
2. If yes: Restore from most recent backup
3. If no backup: Check Downloads folder for JSON exports
4. Import JSON backup if available
5. If no backups: Unfortunately data may be lost
```

### App Running Slowly

#### **Problem**: Slow loading, laggy interface, delayed responses
#### **Solutions**:
1. **Close other apps**: Free up device memory
2. **Restart The Load Down**: Force close and reopen
3. **Clear large datasets**: Archive very old encounters
4. **Update app**: Check for app updates by visiting original URL
5. **Restart device**: Full device restart often helps

#### **Performance Optimization**:
```
- Delete encounters older than 2 years
- Reduce number of photos in friend profiles
- Clear Safari cache weekly
- Keep iOS updated to latest version
- Maintain 2GB+ free storage space
```

---

## 🔐 Security & Authentication Issues

### Locked Out of App

#### **Problem**: Can't remember PIN and biometrics not working
#### **Solutions**:
1. **Try common PINs**: If you use similar PINs for other apps
2. **Check biometric settings**: Ensure Face ID/Touch ID is set up in iOS
3. **Restore from backup**: Reinstall app and restore data from backup
4. **Last resort**: Fresh install (loses data without backup)

⚠️ **Important**: There's no PIN recovery system for security reasons

### PIN Not Accepting Correct Input

#### **Problem**: Entering correct PIN but still getting "incorrect" message
#### **Solutions**:
1. **Check for number pad issues**: Try typing slowly and deliberately
2. **Restart app**: Force close and reopen app
3. **Clear and re-enter**: Clear PIN field completely and re-type
4. **Use biometrics**: Try Face ID/Touch ID instead

### Auto-Lock Not Working

#### **Problem**: App doesn't automatically lock after specified time
#### **Solutions**:
1. **Check timer setting**: Settings → Security → Auto-lock Timer (not "Never")
2. **Test manually**: Use manual lock button to verify security works
3. **Background activity**: App might not be detecting background state
4. **Restart app**: Close and reopen to reset security timer

---

## ☁️ Backup & Sync Issues

### Azure Backup Connection Failed

#### **Problem**: Can't connect to Azure, "Connection Failed" error
#### **Solutions**:
1. **Check credentials**: Verify storage account name, container name, SAS token
2. **Test internet**: Ensure stable WiFi or cellular connection
3. **Regenerate SAS token**: Create new token in Azure Portal
4. **Check permissions**: SAS token needs Read, Write, List permissions
5. **Try different network**: Switch between WiFi and cellular

#### **Common Azure Errors**:
```
"Access Denied" → Check SAS token permissions
"Container Not Found" → Verify container name spelling
"Invalid Account" → Check storage account name
"Network Error" → Check internet connection
```

### Backup Restore Failed

#### **Problem**: Can't restore from Azure backup, gets stuck or errors
#### **Solutions**:
1. **Check backup size**: Large backups may take several minutes
2. **Stable connection**: Use strong WiFi for large backup restoration
3. **Free storage space**: Ensure device has enough space for backup
4. **Try smaller backup**: Restore from earlier, smaller backup if available
5. **Manual JSON import**: Download backup and import as JSON

### JSON Import/Export Issues

#### **Problem**: Can't export or import JSON backup files
#### **Solutions**:
1. **Use Files app**: Export to Files app (iCloud Drive) instead of other locations
2. **Check file size**: Large datasets may take time to export
3. **Storage space**: Ensure sufficient space for export file
4. **File format**: Ensure importing .json files, not other formats
5. **File integrity**: Re-export if imported file seems corrupted

---

## 🗺️ Interface & Navigation Issues

### Bottom Navigation Not Working

#### **Problem**: Can't tap bottom navigation buttons, they're unresponsive
#### **Solutions**:
1. **Check for overlays**: Close any modal dialogs or pop-ups
2. **Scroll to bottom**: Ensure page is scrolled to bottom of content
3. **Restart app**: Force close and reopen
4. **Check for iOS keyboard**: Ensure keyboard is dismissed
5. **Screen responsiveness**: Test if other parts of screen work

### Search/Filter Not Working

#### **Problem**: Search doesn't find results that should exist
#### **Solutions**:
1. **Clear filters**: Remove date range, rating filters, etc.
2. **Check spelling**: Verify search terms are spelled correctly
3. **Try partial terms**: Search for parts of names/locations
4. **Case sensitivity**: Search is case-insensitive, so that shouldn't matter
5. **Data refresh**: Pull down to refresh data

### Maps/Location Features Not Working

#### **Problem**: Maps don't load, location features unavailable
#### **Solutions**:
1. **Enable location services**: Settings → Privacy & Security → Location Services → Safari
2. **Check network**: Maps require internet connection
3. **Try manual entry**: Enter location names manually instead of GPS
4. **Browser permissions**: Allow location access when prompted
5. **Alternative maps**: Use the alternative map view if available

---

## 📊 Analytics & Statistics Issues

### Statistics Seem Wrong

#### **Problem**: Numbers don't match expectations, calculations appear incorrect
#### **Solutions**:
1. **Check data completeness**: Verify all encounters are properly saved
2. **Review algorithm weights**: Settings → Friend Scoring Algorithm
3. **Verify date ranges**: Check if filters are affecting calculations
4. **Run data tests**: Developer Mode → Run Data Tests (if available)
5. **Manual verification**: Count encounters manually for verification

### Friend Rankings Don't Make Sense

#### **Problem**: Friend scores don't match your intuitive understanding
#### **Solutions**:
1. **Review algorithm**: Check scoring algorithm weights in Settings
2. **Customize weights**: Adjust frequency, recency, quality, mutuality percentages
3. **Check recent data**: Recent encounters heavily influence rankings
4. **Verify ratings**: Ensure encounter ratings accurately reflect experiences
5. **Time frame**: Rankings reflect entire history, not just recent feelings

### Analytics Not Updating

#### **Problem**: Statistics don't change after adding new data
#### **Solutions**:
1. **Refresh page**: Pull down to refresh or close/reopen app
2. **Complete data entry**: Ensure all encounters are fully saved
3. **Check calculations**: Some statistics update with slight delay
4. **Clear cache**: Clear Safari cache and reload app
5. **Restart app**: Force close and reopen for fresh calculations

---

## 🔄 Developer Mode & Advanced Features

### Can't Activate Developer Mode

#### **Problem**: Tapping Settings title doesn't activate developer features
#### **Solutions**:
1. **Tap faster**: Must tap 7 times within 3 seconds
2. **Exact location**: Tap directly on "Settings" title text
3. **No obstructions**: Make sure nothing is covering the title
4. **Try multiple times**: May take a few attempts to get timing right
5. **Restart if needed**: Close app and try again

### Sample Data Generation Failed

#### **Problem**: Developer Mode sample data doesn't generate
#### **Solutions**:
1. **Free storage space**: Ensure at least 100MB free space
2. **Backup first**: Create backup before sample generation
3. **Close other apps**: Free up device memory
4. **Restart app**: Close completely and reopen before trying again
5. **Check console**: Look for error messages in browser developer tools

### Data Tests Failing

#### **Problem**: Data integrity tests show errors or failures
#### **Solutions**:
1. **Restore backup**: Use clean backup if data is corrupted
2. **Manual cleanup**: Delete problematic encounters/friends
3. **Fresh start**: Clear all data and start over (backup first!)
4. **Contact support**: Report persistent data integrity issues
5. **Preventive measures**: Regular backups prevent data loss

---

## 🚨 When All Else Fails

### Nuclear Option: Fresh Installation

#### **When to Use**: App completely broken, data corrupted beyond repair
#### **Steps**:
1. **Create backup** (if possible): Settings → Export Data or Azure Backup
2. **Delete app**: Remove from home screen
3. **Clear Safari data**: Settings → Safari → Clear History and Website Data
4. **Restart device**: Full device restart
5. **Reinstall app**: Visit original URL and reinstall
6. **Restore data**: Import backup if available

### Getting Additional Help

#### **Before Contacting Support**:
1. **Try basic fixes**: Restart app, restart device, clear cache
2. **Document issue**: Note exact error messages, steps to reproduce
3. **Check app version**: Note iOS version and app version
4. **Backup data**: Create backup before troubleshooting if possible

#### **Support Channels**:
- **GitHub Issues**: [Create detailed bug report](https://github.com/xenum72-del/bbb/issues)
- **Wiki Documentation**: Check other wiki pages for solutions
- **Community Help**: Search existing GitHub issues for similar problems

#### **What to Include in Bug Reports**:
```
- Device: iPhone model and iOS version
- Problem: Detailed description of issue
- Steps: How to reproduce the problem
- Expected: What should happen
- Actual: What actually happens
- Screenshots: If visual issue, include screenshots
```

---

## 🔧 Preventive Maintenance

### Regular Maintenance Tasks

#### **Weekly** (2 minutes):
- Check that backups are working
- Verify app is still functioning normally
- Clear any cached data if app seems slow

#### **Monthly** (5 minutes):
- Create manual backup (Azure or JSON)
- Review and clean up very old data if needed
- Check for app updates by visiting original URL
- Verify security settings are still configured

#### **Quarterly** (15 minutes):
- Complete backup of all data
- Review all settings and preferences
- Test restore process with backup
- Update any changed security information

### Data Health Best Practices

#### **Backup Strategy**:
1. **Multiple methods**: Use both Azure and JSON backups
2. **Regular schedule**: Weekly automated Azure backups
3. **Before major changes**: Always backup before significant updates
4. **Test restores**: Periodically verify backups actually work

#### **Performance Maintenance**:
1. **Storage monitoring**: Keep device storage healthy (2GB+ free)
2. **App updates**: Check for updates monthly
3. **iOS updates**: Keep iOS reasonably current
4. **Data grooming**: Archive very old data if performance suffers

---

*Next: [Performance Optimization](Performance) →*