#!/bin/bash
# This script helps with Vercel deployment

# Make sure templates and static files are in the right place
echo "Checking directory structure..."
ls -la

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete!"