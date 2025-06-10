#!/bin/bash

echo "🚀 Building NovaTrek for Vercel Preview"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from frontend directory${NC}"
    exit 1
fi

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓ Found: $1${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Missing: $1${NC}"
        return 1
    fi
}

echo -e "\n${YELLOW}1. Checking environment files...${NC}"
check_file ".env.local"
check_file ".env.preview"
check_file "novatrek-app-firebase-adminsdk.json"
check_file "novatrek-app-firebase-adminsdk-prod.json"

# Create .env.local from .env.preview if requested
if [ "$1" == "--setup" ]; then
    echo -e "\n${YELLOW}2. Setting up preview environment...${NC}"
    if [ -f ".env.preview" ]; then
        cp .env.preview .env.local
        echo -e "${GREEN}✓ Copied .env.preview to .env.local${NC}"
    fi
fi

# Clean previous builds
echo -e "\n${YELLOW}3. Cleaning previous builds...${NC}"
rm -rf .next
rm -rf out
echo -e "${GREEN}✓ Cleaned build directories${NC}"

# Install dependencies
echo -e "\n${YELLOW}4. Installing dependencies...${NC}"
npm install

# Run type checking
echo -e "\n${YELLOW}5. Running type check...${NC}"
npm run type-check || echo -e "${YELLOW}⚠ Type errors found but continuing...${NC}"

# Build the application
echo -e "\n${YELLOW}6. Building application (skipping lint)...${NC}"
NODE_ENV=production npm run build:no-lint

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Build completed successfully!${NC}"
    
    # Show build info
    echo -e "\n${YELLOW}Build Information:${NC}"
    echo "- Node version: $(node --version)"
    echo "- NPM version: $(npm --version)"
    echo "- Build time: $(date)"
    
    # Show next steps
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Test locally: npm run start"
    echo "2. Deploy to Vercel: vercel --prod=false"
    echo "3. Or push to a preview branch for automatic deployment"
else
    echo -e "\n${RED}❌ Build failed!${NC}"
    exit 1
fi

# Optional: Create deployment info file
echo -e "\n${YELLOW}7. Creating deployment info...${NC}"
cat > .next/deployment-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "environment": "preview",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
echo -e "${GREEN}✓ Created deployment info${NC}"

echo -e "\n${GREEN}✨ Preview build ready for deployment!${NC}"