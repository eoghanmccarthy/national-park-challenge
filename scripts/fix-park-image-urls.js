// Simple script to fix image URLs in the parks data file
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the parks data file
const parksFilePath = join(__dirname, '../server/parks.ts');
const content = readFileSync(parksFilePath, 'utf-8');

// Fix all image URLs that have a duplicate pattern at the end
let fixedContent = content;

// Find all imageUrl lines with a pattern
const regex = /"imageUrl": "([^"]+)\/([^\/]+?)\.([^"\/\.]+)\/\2\.\3"/g;
fixedContent = fixedContent.replace(regex, (match, prefix, filename, ext) => {
  return `"imageUrl": "${prefix}/${filename}.${ext}"`;
});

// Write the fixed content back to the file
writeFileSync(parksFilePath, fixedContent);

console.log('Fixed image URLs in parks data file');