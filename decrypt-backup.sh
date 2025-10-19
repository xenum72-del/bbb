#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo "Please install jq: brew install jq"
    exit 1
fi

# Check if Node.js is available  
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed${NC}"
    echo "Please install Node.js"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 <backup-file.json>"
    echo ""
    echo "This script decrypts an encrypted backup file created by the BBB app."
    echo "You will be prompted for the PIN used to encrypt the backup."
    echo ""
    echo "Example:"
    echo "  $0 my-backup-encrypted.json"
    exit 1
}

# Check if backup file argument is provided
if [ $# -ne 1 ]; then
    show_usage
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file '$BACKUP_FILE' not found${NC}"
    exit 1
fi

echo -e "${BLUE}🔐 BBB Backup Decryption Tool${NC}"
echo ""

# Extract the encryption fields using jq
echo -e "${BLUE}📖 Reading encrypted data...${NC}"
ENCRYPTED_DATA=$(jq -r '.encryptedData // empty' "$BACKUP_FILE" 2>/dev/null)
SALT=$(jq -r '.salt // empty' "$BACKUP_FILE" 2>/dev/null)
IV=$(jq -r '.iv // empty' "$BACKUP_FILE" 2>/dev/null)
ENCRYPTED_FLAG=$(jq -r '.encrypted // false' "$BACKUP_FILE" 2>/dev/null)

if [ "$ENCRYPTED_FLAG" != "true" ]; then
    echo -e "${RED}Error: Backup file is not encrypted${NC}"
    echo "This backup file appears to be unencrypted."
    exit 1
fi

if [ -z "$ENCRYPTED_DATA" ] || [ -z "$SALT" ] || [ -z "$IV" ]; then
    echo -e "${RED}Error: Missing encryption fields in backup file${NC}"
    echo "This backup file may be corrupted or in an unsupported format."
    exit 1
fi

# Prompt for PIN
echo -n "Enter PIN to decrypt backup: "
read -s PIN
echo ""

if [ -z "$PIN" ]; then
    echo -e "${RED}Error: PIN cannot be empty${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Decrypting...${NC}"

# Create temporary files
TEMP_SCRIPT=$(mktemp -t decrypt_backup_XXXXXX.js)
TEMP_ENCRYPTED=$(mktemp -t encrypted_data_XXXXXX.txt)
TEMP_SALT=$(mktemp -t salt_data_XXXXXX.txt)  
TEMP_IV=$(mktemp -t iv_data_XXXXXX.txt)

# Cleanup function
cleanup() {
    rm -f "$TEMP_SCRIPT" "$TEMP_ENCRYPTED" "$TEMP_SALT" "$TEMP_IV"
}
trap cleanup EXIT

# Write data to temporary files
echo "$ENCRYPTED_DATA" > "$TEMP_ENCRYPTED"
echo "$SALT" > "$TEMP_SALT"
echo "$IV" > "$TEMP_IV"

# Create the Node.js decryption script
cat > "$TEMP_SCRIPT" << 'NODEJS_END'
const crypto = require('crypto');
const fs = require('fs');

try {
    // Get arguments
    const encryptedDataFile = process.argv[2];
    const saltFile = process.argv[3];
    const ivFile = process.argv[4];
    const pin = process.argv[5];
    
    if (!encryptedDataFile || !saltFile || !ivFile || !pin) {
        console.error('Usage: node script.js <encrypted_data_file> <salt_file> <iv_file> <pin>');
        process.exit(1);
    }
    
    // Read data from files
    const encryptedDataBase64 = fs.readFileSync(encryptedDataFile, 'utf8').trim();
    const saltBase64 = fs.readFileSync(saltFile, 'utf8').trim();
    const ivBase64 = fs.readFileSync(ivFile, 'utf8').trim();
    
    // Decode the base64 data
    const encryptedBuffer = Buffer.from(encryptedDataBase64, 'base64');
    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    
    // The encrypted buffer contains data + auth tag (last 16 bytes)
    const authTag = encryptedBuffer.subarray(-16);
    const encryptedData = encryptedBuffer.subarray(0, -16);
    
    // Derive key from PIN using PBKDF2
    const key = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    decrypted = decrypted.toString('utf8');
    
    // Parse and output JSON
    const jsonData = JSON.parse(decrypted);
    console.log(JSON.stringify(jsonData, null, 2));
    
} catch (error) {
    if (error.code === 'OSSL_EVP_BAD_DECRYPT' || 
        error.message.includes('bad decrypt') || 
        error.message.includes('Unsupported state') ||
        error.message.includes('unable to authenticate data')) {
        console.error('DECRYPT_ERROR: Incorrect PIN - authentication failed');
    } else if (error.message.includes('JSON')) {
        console.error('DECRYPT_ERROR: Data corrupted or invalid backup format');
    } else {
        console.error('DECRYPT_ERROR:', error.message);
    }
    process.exit(1);
}
NODEJS_END

# Execute decryption
DECRYPTED_DATA=$(node "$TEMP_SCRIPT" "$TEMP_ENCRYPTED" "$TEMP_SALT" "$TEMP_IV" "$PIN" 2>&1)
EXIT_CODE=$?

# Check if decryption failed
if [ $EXIT_CODE -ne 0 ] || echo "$DECRYPTED_DATA" | grep -q "DECRYPT_ERROR:"; then
    ERROR_MSG=$(echo "$DECRYPTED_DATA" | sed 's/DECRYPT_ERROR: //')
    echo -e "${RED}❌ Decryption failed: $ERROR_MSG${NC}"
    echo ""
    
    if echo "$ERROR_MSG" | grep -q "Incorrect PIN"; then
        echo "The PIN you entered is incorrect. Please try again with the correct PIN."
        echo ""
        echo "💡 Tips:"
        echo "• Make sure you're using the same PIN that was set when the backup was created"
        echo "• Check if Caps Lock is on"
        echo "• Try entering the PIN carefully, character by character"
    elif echo "$ERROR_MSG" | grep -q "corrupted\|invalid backup format"; then
        echo "The backup file appears to be corrupted or in an unsupported format."
        echo ""
        echo "💡 Tips:"
        echo "• Try downloading the backup file again"
        echo "• Verify the file wasn't modified or truncated"
        echo "• Check if this is a valid BBB backup file"
    else
        echo "This could be due to:"
        echo "• Incorrect PIN"
        echo "• Corrupted backup file"
        echo "• Unsupported encryption format"
        echo "• System compatibility issues"
    fi
    exit 1
fi

# Generate output filename
OUTPUT_FILE="${BACKUP_FILE%.json}-decrypted.json"

# Save decrypted data
echo "$DECRYPTED_DATA" > "$OUTPUT_FILE"

echo -e "${GREEN}✅ Decryption successful!${NC}"
echo -e "${GREEN}📄 Decrypted backup saved to: $OUTPUT_FILE${NC}"
echo ""
echo "You can now view the decrypted backup data:"
echo "  cat '$OUTPUT_FILE'"
echo "  jq . '$OUTPUT_FILE'"