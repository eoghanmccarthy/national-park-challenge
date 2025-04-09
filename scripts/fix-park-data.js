// Script to clean up park data including state names, park types, etc.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the parks data file
const parksFilePath = join(__dirname, '../server/parks.ts');
const content = readFileSync(parksFilePath, 'utf-8');

// Parse the data - extract the array part
const parkDataMatch = content.match(/export const nationalParksData: Park\[\] = (\[[\s\S]*\]);/);
if (!parkDataMatch) {
  console.error('Could not find park data in the file');
  process.exit(1);
}

const parkDataString = parkDataMatch[1];
// Replace the duplicate image URL pattern with the correct one
const fixedImageParkDataString = parkDataString.replace(
  /"imageUrl": "([^"]+)\/([^\/]+?)\.([^"\/\.]+)\/\2\.\3"/g, 
  '"imageUrl": "$1/$2.$3"'
);

try {
  // Parse the JSON-like string to a real JSON object
  // Replace trailing commas first
  const cleanedDataString = fixedImageParkDataString
    .replace(/,(\s*[\]}])/g, '$1')
    .replace(/(\w+):/g, '"$1":');
  
  const parks = JSON.parse(cleanedDataString);

  // Process each park
  const processedParks = parks.map(park => {
    // Fix state
    let state = park.state;
    // Check if state contains the date pattern
    if (/^\w+ \d+, \d{4}$/.test(state)) {
      // This is a date, not a state
      switch (park.name) {
        case "Gateway Arch":
          state = "Missouri";
          break;
        case "Crater Lake":
          state = "Oregon";
          break;
        default:
          state = "United States";
      }
    } else if (state.includes("°")) {
      // Contains coordinates, extract just the state name
      state = state.split(",")[0].trim();
    }

    // Fix park names that are just descriptions
    let name = park.name;
    let description = park.description;
    if (name.includes("with") || name.includes("at") || name.toLowerCase() === name) {
      // This is likely a description, not a name
      if (description.includes("National Park")) {
        // Try to extract the name from the description
        const match = description.match(/(.+?) National Park/);
        if (match) {
          name = match[1];
        }
      }
    }

    // Ensure year established is a number
    let yearEstablished = park.yearEstablished;
    if (yearEstablished === 0) {
      // Try to extract from description or state
      const descYear = description.match(/established in (\d{4})/);
      const stateYear = park.state.match(/(\d{4})/);
      if (descYear) {
        yearEstablished = parseInt(descYear[1]);
      } else if (stateYear) {
        yearEstablished = parseInt(stateYear[1]);
      } else {
        yearEstablished = 1950; // Default if we can't find it
      }
    }

    // Determine park type if it's generic "forest"
    let parkType = park.parkType;
    if (parkType === "forest") {
      // Look at the description to try to determine
      if (description.toLowerCase().includes("desert")) {
        parkType = "desert";
      } else if (description.toLowerCase().includes("mountain")) {
        parkType = "mountain";
      } else if (description.toLowerCase().includes("water") || 
                description.toLowerCase().includes("lake") || 
                description.toLowerCase().includes("river")) {
        parkType = "water";
      } else if (description.toLowerCase().includes("canyon")) {
        parkType = "canyon";
      }
    }

    return {
      ...park,
      state,
      name,
      description,
      yearEstablished,
      parkType
    };
  });

  // Write the processed data back to the file
  const outputContent = content.replace(
    /export const nationalParksData: Park\[\] = \[[\s\S]*\];/, 
    `export const nationalParksData: Park[] = ${JSON.stringify(processedParks, null, 2)};`
  );

  writeFileSync(parksFilePath, outputContent);
  console.log('Successfully processed park data');
} catch (error) {
  console.error('Error processing park data:', error);
}