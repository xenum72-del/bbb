#!/bin/bash

# GitHub Wiki Deployment Script for The Load Down
# This script creates and deploys comprehensive wiki pages to GitHub

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="https://github.com/xenum72-del/bbb"
REPO_NAME="bbb"
WIKI_DIR="wiki"
TEMP_DIR="/tmp/loaddown-wiki-deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) is not installed. Manual Git operations will be used."
        USE_GH_CLI=false
    else
        USE_GH_CLI=true
    fi
    
    log_success "Prerequisites check completed"
}

# Create GitHub repository if it doesn't exist
create_repo_if_needed() {
    if [ "$USE_GH_CLI" = true ]; then
        log_info "Checking if repository exists..."
        if ! gh repo view "$REPO_NAME" &> /dev/null; then
            log_info "Creating GitHub repository..."
            gh repo create "$REPO_NAME" --public --description "🏳️‍🌈 The Load Down - Privacy-First Progressive Web App for Personal Relationship Tracking"
            log_success "Repository created successfully"
        else
            log_info "Repository already exists"
        fi
    else
        log_warning "GitHub CLI not available. Please ensure repository exists manually at $REPO_URL"
    fi
}

# Clone or prepare wiki repository
prepare_wiki_repo() {
    log_info "Preparing wiki repository..."
    
    # Clean up any existing temp directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Clone the wiki repository
    WIKI_REPO_URL="${REPO_URL}.wiki.git"
    
    if git clone "$WIKI_REPO_URL" "$TEMP_DIR" 2>/dev/null; then
        log_success "Wiki repository cloned successfully"
    else
        log_info "Wiki doesn't exist yet, let's set it up..."
        cd "$TEMP_DIR"
        
        log_info "🔧 The wiki feature needs to be enabled in your GitHub repository first."
        log_info ""
        log_info "📋 Please follow these steps:"
        log_info "   1. Open: https://github.com/xenum72-del/bbb/settings"
        log_info "   2. Scroll to the 'Features' section"
        log_info "   3. Check the ✅ 'Wikis' checkbox"
        log_info "   4. Click 'Save changes'"
        log_info "   5. Go to: https://github.com/xenum72-del/bbb/wiki"
        log_info "   6. Click 'Create the first page'"
        log_info "   7. Add any content and save it"
        log_info "   8. Run this script again"
        log_info ""
        
        printf "🎯 Alternative: Deploy to a 'docs' folder in main repository? (y/n): "
        read -r response
        if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
            deploy_to_docs_folder
            return 0
        else
            log_info ""
            log_info "💡 Tip: After enabling wiki in GitHub, the script will work automatically!"
            cleanup_and_exit 0
        fi
    fi
}

# Copy wiki files to the repository
copy_wiki_files() {
    log_info "Copying wiki files..."
    
    cd "$TEMP_DIR"
    
    # Copy all wiki files from the original script directory
    if [ -d "$SCRIPT_DIR/$WIKI_DIR" ]; then
        cp -r "$SCRIPT_DIR/$WIKI_DIR"/* .
        log_success "Wiki files copied successfully"
    else
        log_error "Wiki directory not found at $SCRIPT_DIR/$WIKI_DIR"
        log_info "Creating wiki files from scratch..."
        
        # If wiki directory doesn't exist, let's create the files directly
        mkdir -p "$SCRIPT_DIR/$WIKI_DIR"
        log_info "Created wiki directory at $SCRIPT_DIR/$WIKI_DIR"
        log_info "Please run the script again after wiki files are created"
        exit 1
    fi
}

# Create additional wiki pages
create_additional_pages() {
    log_info "Creating additional wiki pages..."
    
    cd "$TEMP_DIR"
    
    # Create _Sidebar.md for navigation
    cat > _Sidebar.md << 'EOF'
## 📚 Wiki Navigation

### 🚀 Getting Started
* [Installation Guide](Installation)
* [Getting Started](Getting-Started)
* [Dashboard Overview](Dashboard)

### 📱 Core Features  
* [Friend Management](Friends)
* [Encounter Logging](Encounters)
* [Analytics & Insights](Analytics)
* [Timeline View](Timeline)

### ⚙️ Configuration
* [Settings Guide](Settings)
* [Security Setup](Security)
* [Scoring Algorithm](Scoring-Algorithm)

### ☁️ Data Management
* [Azure Cloud Backup](Azure-Backup)
* [Device Migration](Device-Migration)
* [Backup & Export](Backup-Export)

### 🔧 Advanced Features
* [Developer Mode](Developer-Mode)
* [Sample Data Generation](Sample-Data)
* [Data Testing Suite](Data-Testing)

### 🆘 Support
* [FAQ](FAQ)
* [Troubleshooting](Troubleshooting)
* [Privacy Policy](Privacy-Policy)

---
*[View All Pages →](Home)*
EOF

    # Create _Footer.md
    cat > _Footer.md << 'EOF'
---
🏳️‍🌈 **The Load Down** | Built with ❤️ and TypeScript | Privacy-First, Always | [GitHub](https://github.com/xenum72-del/bbb) | Version 1.0.0
EOF

    log_success "Additional pages created"
}

# Commit and push changes
deploy_wiki() {
    log_info "Deploying wiki to GitHub..."
    
    cd "$TEMP_DIR"
    
    # Configure git if needed
    if [ -z "$(git config user.name)" ]; then
        git config user.name "Load Down Wiki Bot"
    fi
    
    if [ -z "$(git config user.email)" ]; then
        git config user.email "wiki@theloaddown.app"
    fi
    
    # Add all files
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        log_info "No changes to deploy"
        return
    fi
    
    # Commit changes
    commit_message="📚 Deploy comprehensive wiki documentation

- Complete installation and setup guides
- Detailed feature documentation  
- Security and privacy guides
- Azure backup integration docs
- Developer mode and sample data guides
- Troubleshooting and FAQ sections
- Device migration instructions

Total pages: $(find . -name "*.md" | wc -l)"
    
    git commit -m "$commit_message"
    
    # Push to GitHub
    if git push origin HEAD 2>/dev/null; then
        log_success "Wiki deployed successfully!"
    else
        # Try different branch names
        if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
            log_success "Wiki deployed successfully!"
        else
            log_error "Failed to push wiki to GitHub. Please check your permissions."
            exit 1
        fi
    fi
}

# Generate deployment summary
generate_summary() {
    log_info "Generating deployment summary..."  
    
    cd "$TEMP_DIR"
    
    echo ""
    echo "======================================"
    echo "🏳️‍🌈 THE LOAD DOWN WIKI DEPLOYMENT"
    echo "======================================"
    echo ""
    echo "📚 Wiki URL: ${REPO_URL}/wiki"
    echo "📝 Total Pages: $(find . -name "*.md" | wc -l)"
    echo "💾 Repository: $REPO_URL"
    echo ""
    echo "📋 Deployed Pages:"
    find . -name "*.md" -not -path "./.git/*" | sort | sed 's|^\./||' | sed 's|\.md$||' | while read page; do
        echo "   • $page"
    done
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Visit ${REPO_URL}/wiki to view your documentation"
    echo "   2. Customize any pages as needed"
    echo "   3. Enable wiki in repository settings if not already enabled"
    echo "   4. Share the wiki URL with users and contributors"
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
}

# Alternative deployment to docs folder
deploy_to_docs_folder() {
    log_info "🚀 Deploying to docs folder in main repository..."
    
    # Navigate to the main repository
    cd "$SCRIPT_DIR"
    
    # Create docs folder if it doesn't exist
    mkdir -p docs/wiki
    
    # Copy all wiki files
    log_info "📝 Copying wiki files to docs/wiki/..."
    cp wiki/*.md docs/wiki/ 2>/dev/null || true
    
    # Create a simple index.html for GitHub Pages
    cat > docs/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Load Down - Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #6366f1; border-bottom: 2px solid #e5e7eb; }
        .emoji { font-size: 1.2em; }
        a { color: #6366f1; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .category { margin: 20px 0; }
        .page-list { list-style: none; padding: 0; }
        .page-list li { margin: 8px 0; }
    </style>
</head>
<body>
    <h1>🏳️‍🌈 The Load Down - Documentation</h1>
    <p>Welcome to the comprehensive documentation for <strong>The Load Down</strong> - your privacy-first progressive web app for personal relationship tracking.</p>
    
    <div class="category">
        <h2>📚 Documentation Pages</h2>
        <ul class="page-list">
            <li><a href="wiki/Home.html">🏠 Home & Navigation</a></li>
            <li><a href="wiki/Installation.html">📱 Installation Guide</a></li>
            <li><a href="wiki/Getting-Started.html">🚀 Getting Started</a></li>
            <li><a href="wiki/Developer-Mode.html">🔧 Developer Mode</a></li>
            <li><a href="wiki/Azure-Backup.html">☁️ Azure Backup</a></li>
            <li><a href="wiki/Device-Migration.html">📲 Device Migration</a></li>
            <li><a href="wiki/Sample-Data.html">🎭 Sample Data</a></li>
            <li><a href="wiki/Security.html">🔒 Security Guide</a></li>
            <li><a href="wiki/FAQ.html">❓ FAQ & Troubleshooting</a></li>
        </ul>
    </div>
    
    <p><strong>Note:</strong> This is a alternative documentation deployment. For the full wiki experience, please enable GitHub Wiki in repository settings.</p>
</body>
</html>
EOF
    
    # Add to git and commit
    git add docs/
    git commit -m "📚 Add comprehensive documentation to docs folder" || true
    
    log_success "✅ Documentation deployed to docs/ folder!"
    log_info "🌐 You can now enable GitHub Pages to make it accessible online:"
    log_info "   1. Go to https://github.com/xenum72-del/bbb/settings/pages"
    log_info "   2. Select 'Deploy from a branch'"
    log_info "   3. Choose 'main' branch and '/docs' folder"
    log_info "   4. Click 'Save'"
    log_info "   5. Your docs will be available at: https://xenum72-del.github.io/bbb/"
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    echo ""
    echo "🏳️‍🌈 THE LOAD DOWN - WIKI DEPLOYMENT SCRIPT"
    echo "============================================="
    echo ""
    
    check_prerequisites
    create_repo_if_needed
    prepare_wiki_repo
    copy_wiki_files
    create_additional_pages
    deploy_wiki
    generate_summary
    cleanup
    
    echo "🎉 Wiki deployment completed successfully!"
    echo "📚 Visit your wiki at: ${REPO_URL}/wiki"
    echo ""
}

# Error handling
trap cleanup EXIT

# Run main function
main "$@"