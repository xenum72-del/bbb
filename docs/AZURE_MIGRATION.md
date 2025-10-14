# Azure Cloud Storage Migration

## Overview

"The Load Down" now supports seamless data synchronization with Microsoft Azure cloud storage. This feature allows you to:

- **Backup your data** to the cloud for safety and redundancy
- **Sync across devices** by uploading from one device and downloading to another
- **Maintain privacy** with your own Azure storage account (your data never touches our servers)
- **Scale affordably** with Azure's pay-per-use pricing model

## How It Works

### Architecture

1. **Azure Table Storage**: Stores structured data (friends, encounters, interaction types, settings)
2. **Azure Blob Storage**: Stores photos and files with CDN-ready URLs
3. **Client-Side Encryption**: Your data is encrypted before upload
4. **User-Partitioned**: Each user's data is isolated using unique partition keys

### Data Organization

```
Azure Table Storage:
├── Friends (PartitionKey: userId, RowKey: friendId)
├── Encounters (PartitionKey: userId, RowKey: encounterId)
├── InteractionTypes (PartitionKey: userId, RowKey: typeId)
└── Settings (PartitionKey: userId, RowKey: settingId)

Azure Blob Storage:
├── Container: photos
├── Blobs: userId/friendId/photo.jpg
└── Blobs: userId/encounterId/photo_0.jpg
```

## Setup Instructions

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Storage Account**
3. Choose **Standard** performance tier
4. Select **Locally Redundant Storage (LRS)** for cost efficiency
5. Note your **Storage Account Name** and **Access Key**

### 2. Configure in App

1. Open Settings → Azure Cloud Storage
2. Enter your **Storage Account Name** (without .table.core.windows.net)
3. Enter your **Storage Account Key**
4. Optionally customize the **Table Name** (default: "theloaddown")
5. Click **Test Connection** to verify

### 3. Migration Options

**Migrate TO Azure** (Upload):
- Uploads all local data to your Azure storage
- Keeps local data intact
- Use for backup or when switching to a new device

**Migrate FROM Azure** (Download):
- Downloads data from Azure and merges with local data
- Handles duplicate detection intelligently
- Use for restoring or syncing data to a new device

## Cost Estimation

For typical usage (100 friends, 1000 encounters, 500 photos):

- **Table Storage**: ~$0.01/month (1M operations free tier)
- **Blob Storage**: ~$0.03-0.15/month (depends on photo sizes)
- **Total**: ~$0.04-0.16/month per user

Azure offers generous free tiers that cover most personal use cases.

## Security & Privacy

### What We Store
- **Encrypted JSON data** in Table Storage
- **Original photos** in private Blob Storage
- **User-specific partition keys** for data isolation

### What We DON'T Store
- **No Microsoft/third-party access** to your storage account
- **No data on our servers** - everything goes directly to YOUR Azure account
- **No tracking or analytics** in the cloud storage
- **No shared infrastructure** - your data is completely isolated

### Encryption
- Data is encrypted using AES-256 before upload
- Photos are stored in private containers with SAS token access
- All transfers use HTTPS/TLS encryption
- You control the encryption keys through your Azure account

## Troubleshooting

### Connection Issues
- Verify storage account name (no .table.core.windows.net suffix)
- Check access key is correct and has sufficient permissions
- Ensure Azure account has Table Storage and Blob Storage enabled
- Try regenerating storage account keys if connection fails

### Migration Errors
- Check internet connectivity
- Verify sufficient Azure storage quota
- Look for CORS configuration if browser blocks requests
- Contact support if data corruption occurs

### Performance Tips
- Use Azure regions close to your location for better speed
- Consider Premium storage tier for high-frequency access
- Monitor costs in Azure Portal billing section

## Demo Mode

The app includes a **Try Migration Demo** feature that simulates the migration process without requiring real Azure credentials. This helps you understand the flow before setting up actual cloud storage.

## Support

For technical issues:
1. Check Azure Portal for storage account status
2. Review error messages in browser developer console
3. Verify network connectivity and firewall settings
4. Contact app support with specific error messages

---

*Last updated: December 2024*