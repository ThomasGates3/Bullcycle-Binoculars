#!/bin/bash
set -e

echo "🚀 Deploying Crypto News Enrichment Microservice"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Lambda function
echo -e "${YELLOW}📦 Step 1: Building Lambda function...${NC}"
cd src/lambda/crypto-news

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Compiling TypeScript..."
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed: dist directory not created${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Lambda build complete${NC}"
cd ../../../

# Step 2: Check Terraform configuration
echo -e "${YELLOW}🔧 Step 2: Validating Terraform...${NC}"
cd terraform

if [ ! -f "terraform.tfvars" ]; then
  echo -e "${RED}❌ Error: terraform.tfvars not found${NC}"
  echo "   Copy terraform.tfvars.example to terraform.tfvars and fill in your values"
  exit 1
fi

# Check for required variables
if ! grep -q "newsdata_api_key" terraform.tfvars; then
  echo -e "${RED}❌ Error: newsdata_api_key not set in terraform.tfvars${NC}"
  exit 1
fi

terraform init -upgrade

echo -e "${GREEN}✅ Terraform validation complete${NC}"

# Step 3: Plan deployment
echo -e "${YELLOW}📋 Step 3: Planning deployment...${NC}"
terraform plan -var-file=terraform.tfvars -out=tfplan

# Step 4: Ask for confirmation
echo ""
echo -e "${YELLOW}⚠️  Review the plan above. Do you want to proceed? (yes/no)${NC}"
read -p "Continue? " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled"
  rm tfplan
  exit 0
fi

# Step 5: Apply deployment
echo -e "${YELLOW}🚀 Step 5: Deploying infrastructure...${NC}"
terraform apply tfplan
rm tfplan

# Step 6: Get outputs
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📌 Important Outputs:${NC}"
terraform output -json | jq '
  {
    api_endpoint: .api_gateway_url.value,
    lambda_function: .lambda_function_name.value,
    dynamodb_table: .dynamodb_table_name.value,
    cloudfront_url: .live_url.value
  }
'

# Step 7: Display next steps
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Copy your API endpoint from above (api_gateway_url)"
echo "2. Add it to FRONTEND_INTEGRATION.md as the API_URL"
echo "3. Test the endpoint:"
echo ""
echo "   curl \"$(terraform output -raw api_gateway_url)/news?sentiment=all\""
echo ""
echo "4. Integrate into frontend per FRONTEND_INTEGRATION.md"
echo "5. Monitor Lambda logs:"
echo ""
echo "   aws logs tail /aws/lambda/crypto-news-enricher --follow"
echo ""

cd ../
