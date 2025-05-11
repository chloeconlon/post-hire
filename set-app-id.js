const fs = require('fs');

// Read the current config
const configPath = './capacitor.config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Set the app ID
config.appId = 'com.maggiecahill.myjobs';

// Write back to the file
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('App ID set to:', config.appId);