#!/bin/bash

# 🛡️ Local Safety Audit Script for Encounter Ledger PWA
# Run this script to perform security checks locally before committing

set -e

echo "🏳️‍🌈 Starting Gay Safety & Security Audit..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
PASSED=0
FAILED=0

# Function to print results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "✅ ${GREEN}$2${NC}"
        ((PASSED++))
    else
        echo -e "❌ ${RED}$2${NC}"
        ((FAILED++))
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --silent

echo ""
echo -e "${BLUE}🔍 Running security checks...${NC}"
echo ""

# 1. NPM Security Audit
echo "🔒 Checking for package vulnerabilities..."
if npm audit --audit-level=moderate --silent; then
    print_result 0 "NPM Security Audit: No high/critical vulnerabilities"
else
    print_result 1 "NPM Security Audit: Vulnerabilities found - run 'npm audit' for details"
fi

# 2. TypeScript Safety Check
echo "🔷 Running TypeScript safety analysis..."
if npx tsc --noEmit --strict --silent; then
    print_result 0 "TypeScript Safety: All types validated"
else
    print_result 1 "TypeScript Safety: Type safety issues found"
fi

# 3. Build Test
echo "🏗️ Testing production build..."
if npm run build > /dev/null 2>&1; then
    print_result 0 "Build Test: Production build successful"
else
    print_result 1 "Build Test: Production build failed"
fi

# 4. Privacy Check - External Network Calls
echo "🌐 Scanning for external network calls..."
NETWORK_CALLS=$(grep -r -n "fetch\|XMLHttpRequest\|axios" src/ --include="*.ts" --include="*.tsx" | grep -v "analytics.ts" | grep -v "// " || true)

if [ -z "$NETWORK_CALLS" ]; then
    print_result 0 "Privacy Check: No unauthorized external network calls"
else
    print_result 1 "Privacy Check: External network calls detected (review analytics.ts)"
fi

# 5. Tracking Analysis
echo "🍪 Checking for tracking code..."
TRACKING_CODE=$(grep -r -n "gtag\|google-analytics\|facebook\|twitter" src/ --include="*.ts" --include="*.tsx" || true)

if [ -z "$TRACKING_CODE" ]; then
    print_result 0 "Tracking Analysis: No third-party tracking detected"
else
    print_result 1 "Tracking Analysis: Third-party tracking code found"
fi

# 6. Crypto Safety Check
echo "🔐 Checking cryptographic implementations..."
WEAK_CRYPTO=$(grep -r -i -n "md5\|sha1\|des\|rc4" src/ --include="*.ts" --include="*.tsx" || true)

if [ -z "$WEAK_CRYPTO" ]; then
    print_result 0 "Crypto Safety: No weak cryptographic algorithms"
else
    print_result 1 "Crypto Safety: Weak cryptographic algorithms detected"
fi

# 7. Personal Data Patterns
echo "👤 Scanning for personal data collection patterns..."
PERSONAL_DATA=$(grep -r -i -n "email\|phone\|address\|ssn\|credit.*card" src/ --include="*.ts" --include="*.tsx" | grep -v "// " | grep -v "example" || true)

if [ -z "$PERSONAL_DATA" ]; then
    print_result 0 "Privacy Scan: No personal data collection patterns"
else
    print_result 1 "Privacy Scan: Personal data patterns detected (verify not collected)"
fi

# 8. Inclusive Language Check
echo "💬 Checking for inclusive language..."
EXCLUSIVE_TERMS=$(grep -r -i -n "straight.*only\|normal.*people\|weird\|abnormal\|deviant" src/ --include="*.ts" --include="*.tsx" || true)

if [ -z "$EXCLUSIVE_TERMS" ]; then
    print_result 0 "Inclusivity Check: No exclusionary language detected"
else
    print_result 1 "Inclusivity Check: Potentially exclusionary terms found"
fi

# 9. Security Headers Check (if manifest exists)
if [ -f "public/manifest.json" ]; then
    echo "📱 Checking PWA security configuration..."
    SENSITIVE_PERMS=$(grep -i "geolocation\|camera\|microphone\|contacts" public/manifest.json || true)
    
    if [ -z "$SENSITIVE_PERMS" ]; then
        print_result 0 "PWA Security: No sensitive permissions requested"
    else
        print_result 1 "PWA Security: Sensitive permissions detected in manifest"
    fi
fi

# 10. Environment Security
echo "🌍 Checking for exposed secrets..."
EXPOSED_SECRETS=$(grep -r -n -i "password\|secret\|key.*=\|token" src/ --include="*.ts" --include="*.tsx" | grep -v "import.meta.env" | grep -v "// " | grep -v "interface" || true)

if [ -z "$EXPOSED_SECRETS" ]; then
    print_result 0 "Secret Scan: No hardcoded secrets detected"
else
    print_result 1 "Secret Scan: Potential hardcoded secrets found"
fi

# 11. Runtime Behavior Test (if puppeteer is available)
if command -v npm >/dev/null 2>&1 && npm list puppeteer >/dev/null 2>&1; then
    echo "🎭 Running runtime behavior analysis..."
    
    # Build and serve app for testing
    if npm run build >/dev/null 2>&1; then
        # Start server in background
        npx serve dist -l 3333 >/dev/null 2>&1 &
        SERVER_PID=$!
        sleep 3
        
        # Create quick behavior test
        cat > quick-behavior-test.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    let networkRequests = 0;
    page.on('request', (req) => {
      if (!req.url().includes('localhost')) networkRequests++;
    });
    
    await page.goto('http://localhost:3333', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Test offline capability
    await page.setOfflineMode(true);
    await page.reload();
    const offlineContent = await page.content();
    
    const results = {
      loads: offlineContent.length > 1000,
      offline: offlineContent.includes('html'),
      externalRequests: networkRequests
    };
    
    console.log(JSON.stringify(results));
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
})();
EOF
        
        # Run quick test
        BEHAVIOR_RESULT=$(node quick-behavior-test.js 2>/dev/null || echo '{"error":"test failed"}')
        
        # Clean up
        kill $SERVER_PID 2>/dev/null || true
        rm -f quick-behavior-test.js
        
        # Parse results
        LOADS=$(echo "$BEHAVIOR_RESULT" | grep -o '"loads":true' || true)
        OFFLINE=$(echo "$BEHAVIOR_RESULT" | grep -o '"offline":true' || true)
        EXT_REQ=$(echo "$BEHAVIOR_RESULT" | grep -o '"externalRequests":[0-9]*' | cut -d: -f2 || echo "unknown")
        
        if [ -n "$LOADS" ] && [ -n "$OFFLINE" ] && [ "$EXT_REQ" = "0" ]; then
            print_result 0 "Runtime Behavior: App works offline with no external requests"
        else
            print_result 1 "Runtime Behavior: Issues detected (offline: $OFFLINE, external requests: $EXT_REQ)"
        fi
    else
        print_result 1 "Runtime Behavior: Build failed, cannot test runtime"
    fi
else
    echo "ℹ️  Runtime behavior test skipped (puppeteer not installed)"
    echo "   Install with: npm install --save-dev puppeteer"
fi

# 12. Bundle Analysis (if available)
echo "📦 Analyzing bundle for security risks..."
if [ -f "dist/assets/index-*.js" ]; then
    # Check bundle size
    BUNDLE_SIZE=$(find dist/assets -name "index-*.js" -exec wc -c {} + | tail -1 | awk '{print $1}')
    BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
    
    if [ $BUNDLE_SIZE_KB -lt 500 ]; then
        print_result 0 "Bundle Analysis: Reasonable size (${BUNDLE_SIZE_KB}KB)"
    elif [ $BUNDLE_SIZE_KB -lt 1000 ]; then
        print_result 1 "Bundle Analysis: Large bundle (${BUNDLE_SIZE_KB}KB) - review dependencies"
    else
        print_result 1 "Bundle Analysis: Very large bundle (${BUNDLE_SIZE_KB}KB) - optimization needed"
    fi
    
    # Check for common security issues in bundle
    DANGEROUS_PATTERNS=$(grep -c "eval\|Function(\|innerHTML\|document.write" dist/assets/index-*.js 2>/dev/null || echo "0")
    
    if [ "$DANGEROUS_PATTERNS" -eq 0 ]; then
        print_result 0 "Bundle Security: No dangerous patterns in compiled code"
    else
        print_result 1 "Bundle Security: $DANGEROUS_PATTERNS potentially dangerous patterns found"
    fi
else
    echo "ℹ️  Bundle analysis skipped (no built files found)"
    echo "   Run 'npm run build' first for complete analysis"
fi

echo ""
echo "================================================="
echo -e "${BLUE}🏳️‍🌈 Gay Safety Audit Summary${NC}"
echo "================================================="
echo -e "✅ ${GREEN}Checks Passed: $PASSED${NC}"
echo -e "❌ ${RED}Issues Found: $FAILED${NC}"

# Generate certification
if [ $FAILED -eq 0 ]; then
    echo -e "🏆 ${GREEN}SAFETY CERTIFIED${NC} - Your app meets gay safety standards!"
    BADGE_STATUS="SAFETY%20CERTIFIED"
    BADGE_COLOR="brightgreen"
elif [ $FAILED -lt 3 ]; then
    echo -e "⚡ ${YELLOW}MOSTLY SAFE${NC} - Minor issues detected, overall good safety posture"
    BADGE_STATUS="MOSTLY%20SAFE" 
    BADGE_COLOR="yellow"
else
    echo -e "⚠️ ${RED}NEEDS REVIEW${NC} - Multiple safety issues require attention"
    BADGE_STATUS="NEEDS%20REVIEW"
    BADGE_COLOR="orange"
fi

echo ""
echo "📊 To run individual checks:"
echo "  npm audit                    # Package vulnerabilities"
echo "  npx tsc --noEmit --strict    # Type safety" 
echo "  npm run build                # Build test"
echo ""
echo "🔗 Full automated audit runs on every commit via GitHub Actions"
echo "📋 View detailed reports at: docs/safety-reports/"

# Create simple badge for local use
echo ""
echo "🏅 Safety Badge:"
echo "[![Gay Safety](https://img.shields.io/badge/Gay%20Safety-$BADGE_STATUS-$BADGE_COLOR)](docs/SAFETY-AUDIT.md)"

exit $FAILED