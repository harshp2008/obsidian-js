#!/bin/bash

# Install main package dependencies
echo "Installing main package dependencies..."
npm install

# Create directories for demo if they don't exist
mkdir -p demo/src/app

# Install demo dependencies
echo "Installing demo dependencies..."
cd demo
npm install

echo "Setup complete! You can now run 'npm run dev' to start the demo." 