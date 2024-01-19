#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to your server.js file
const projectRoot = process.cwd();
const filePath = path.join(projectRoot, './.next/standalone/server.js');

const uniqueIdentifierStart = '// DYNAMIC_CONFIG_ENV_VARIABLES_PATCH_START';
const uniqueIdentifierEnd = '// DYNAMIC_CONFIG_ENV_VARIABLES_PATCH_END';

// Custom configuration to be inserted
const customCode = `${uniqueIdentifierStart}
if (nextConfig.publicRuntimeConfig) {
  for (const key in nextConfig.publicRuntimeConfig) {
    if (nextConfig.publicRuntimeConfig.hasOwnProperty(key) && key.startsWith('ENV_')) {
      nextConfig.publicRuntimeConfig[key] = process.env[key] || nextConfig.publicRuntimeConfig[key];   
    }
  }
}
if (nextConfig.serverRuntimeConfig) {
  for (const key in nextConfig.serverRuntimeConfig) {
    if (nextConfig.serverRuntimeConfig.hasOwnProperty(key) && key.startsWith('ENV_')) {
      nextConfig.serverRuntimeConfig[key] = process.env[key] || nextConfig.serverRuntimeConfig[key];   
    }
  }
}
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);
${uniqueIdentifierEnd}
`;

// Read the server.js file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // Regular expression to find the existing custom code block
  const regex = new RegExp(`\n${uniqueIdentifierStart}[\\s\\S]*?${uniqueIdentifierEnd}\n`, 'g');

  // Remove existing custom code (if any)
  let modifiedData = data.replace(regex, '');

  // Insert the new custom code before startServer
  modifiedData = modifiedData.replace(/(startServer\(\{)/, `${customCode}\n$1`);

  // Write the modified content back to the file
  fs.writeFile(filePath, modifiedData, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error("Error writing file:", writeErr);
      return;
    }

    console.log("server.js file modified and saved successfully.");
  });
});
