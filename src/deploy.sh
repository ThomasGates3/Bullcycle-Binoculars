#!/bin/bash

# Easy AWS Deployment Script for Crypto Tracker
# Replace these variables with your actual values:

BUCKET_NAME="my-crypto-tracker-website-2025"
REGION="us-east-1"

echo "🚀 Deploying Crypto Tracker to AWS..."

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found! Make sure you're in the right directory."
    exit 1
fi

# Upload to S3
echo "📁 Uploading to S3 bucket: $BUCKET_NAME"
aws s3 cp index.html s3://$BUCKET_NAME/index.html --content-type "text/html" --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
    echo "🌐 Your website is available at:"
    echo "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
    
    # If you have CloudFront, uncomment the next lines:
    # echo "⚡ CloudFront URL:"
    # echo "   https://YOUR-CLOUDFRONT-ID.cloudfront.net"
    
else
    echo "❌ Upload failed! Make sure AWS CLI is configured."
    echo "Run 'aws configure' to set up your credentials."
fi

echo "🎉 Deployment complete!"