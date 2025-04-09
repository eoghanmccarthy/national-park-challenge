import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nationalParksData } from '../server/parks';
import { Park } from '../shared/schema';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the URL
const wikiUrl = 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States';

async function fetchNationalParks() {
  console.log('Fetching national parks data from Wikipedia...');
  
  try {
    // Fetch the Wikipedia page
    const response = await fetch(wikiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Wikipedia page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // First, let's examine all tables to better understand the structure
    console.log('Analyzing tables on the page...');
    $('table').each((i, table) => {
      console.log(`Table ${i}: ${$(table).attr('class') || 'no class'}`);
      
      // Print the first few header cell texts to identify the table
      const headers = $(table).find('th');
      const headerTexts: string[] = [];
      headers.each((j, th) => {
        if (j < 5) headerTexts.push($(th).text().trim());
      });
      console.log(`  Headers: ${headerTexts.join(' | ')}`);
      
      // Check if this table might contain park data
      if (headerTexts.some(text => text.includes('Park')) || 
          headerTexts.some(text => text.includes('Image')) ||
          headerTexts.some(text => text.includes('Date'))) {
        console.log('  ^^ This table might contain park data ^^');
      }
    });
    
    // Let's try to find the table with park information - looking for a table with park names
    // The table we want likely has "Park" in one of its headers
    let parkTable;
    
    // Try different selectors to find the right table
    const possibleTables = [
      $('table.wikitable').filter((i, table) => {
        return $(table).find('th').text().includes('Park');
      }),
      // Backup: look for any table with park names
      $('table').filter((i, table) => {
        const text = $(table).text();
        return text.includes('Acadia') && text.includes('Yellowstone') && text.includes('Yosemite');
      })
    ];
    
    for (const tables of possibleTables) {
      if (tables.length > 0) {
        parkTable = tables[0];
        console.log(`Found park table with selector: ${parkTable ? 'success' : 'failed'}`);
        break;
      }
    }
    
    // If still not found, try a more direct approach
    if (!parkTable) {
      // Look for the specific heading before the table
      $('h2, h3').each((i, heading) => {
        if ($(heading).text().includes('List')) {
          const nextTable = $(heading).nextAll('table').first();
          if (nextTable.length) {
            parkTable = nextTable[0];
            console.log('Found table after a "List" heading');
            return false;
          }
        }
      });
    }
    
    if (!parkTable) {
      // Last resort: just use the largest table on the page
      const tables = $('table').toArray();
      if (tables.length > 0) {
        // Sort by number of rows
        tables.sort((a, b) => {
          return $(b).find('tr').length - $(a).find('tr').length;
        });
        parkTable = tables[0];
        console.log('Using the largest table as a fallback');
      } else {
        throw new Error('Could not find any tables on the page');
      }
    }
    
    const parkRows = $(parkTable).find('tbody > tr').slice(1); // Skip header row
    console.log(`Found ${parkRows.length} park rows in the table`);
    
    const parks: Park[] = [];
    const existingParkMap = new Map(nationalParksData.map(park => [park.name, park]));
    
    // Process each row
    parkRows.each((index, element) => {
      const columns = $(element).find('td');
      
      // Skip rows that don't have enough columns
      if (columns.length < 5) {
        console.log(`Skipping row ${index + 1}: insufficient columns (${columns.length})`);
        return;
      }
      
      // For this Wikipedia page, we need to find the actual park name.
      // Sometimes it's in a link directly in column 0, sometimes it's in a subsequent column
      let name = '';
      let isRealParkName = false;
      
      // First try: direct link in column 0 (this is usually the real park name)
      const directLinks = $(columns[0]).children('a');
      if (directLinks.length) {
        name = directLinks.first().text().trim();
        isRealParkName = true;
      }
      
      // Second try: check for any links in the cell that might contain the park name
      if (!isRealParkName) {
        const allLinks = $(columns[0]).find('a');
        allLinks.each((i, link) => {
          const linkHref = $(link).attr('href') || '';
          const linkText = $(link).text().trim();
          
          // If link points to a specific park page and contains useful text, use it
          if (linkHref.includes('National_Park') && linkText && !linkText.match(/^File:/)) {
            name = linkText;
            isRealParkName = true;
            return false; // Break the loop
          }
        });
      }
      
      // Third try: if we don't have a proper name yet, use our existing park data for matching
      if (!isRealParkName) {
        // Fall back to the next cell, which might have the park name in a different format
        if (!name) {
          // If name is still empty or doesn't look like a park name, check the next columns
          for (let colIndex = 1; colIndex < columns.length; colIndex++) {
            const colLinks = $(columns[colIndex]).find('a');
            colLinks.each((i, link) => {
              const linkHref = $(link).attr('href') || '';
              const linkText = $(link).text().trim();
              
              // If link points to a specific park page, use it
              if (linkHref.includes('National_Park') && linkText) {
                name = linkText;
                isRealParkName = true;
                return false; // Break the inner loop
              }
            });
            
            if (isRealParkName) break; // Break the outer loop if we found a name
          }
        }
      }
      
      // If all else fails, use what we have, which might be an image caption
      if (!name) {
        // Method: If no name found yet, try to get the entire cell text
        name = $(columns[0]).text().trim();
        
        // If still no name, try to get alt text from any image
        if (!name) {
          const imgAlt = $(columns[0]).find('img').attr('alt');
          if (imgAlt) name = imgAlt.trim();
        }
      }
      
      // Clean up the name
      name = name.replace(/\[\d+\]/g, '').replace(/[†*‡]/g, '').trim();
      
      // If we still don't have a name, we'll skip this row
      if (!name) {
        console.log(`Skipping row ${index + 1}: could not extract park name`);
        return;
      }
      
      // If the name looks like an image caption (not a real park name), try to use the existing data
      if (!isRealParkName && (name.includes('view') || name.includes('landscape') || name.includes('lighthouse') || name.includes('arch'))) {
        // This is likely an image caption, so let's try to match with existing parks
        // See if there's a match in our existing park data by looking at row index
        const existingPark = nationalParksData[index];
        if (existingPark) {
          // Overwrite the caption with the real park name but keep the image URL
          console.log(`Row ${index + 1}: Replacing caption "${name}" with park name "${existingPark.name}"`);
          name = existingPark.name;
          isRealParkName = true;
        }
      }
      
      // Debug output to examine what's happening with the name
      console.log(`Row ${index + 1}: Name='${name}', Real name: ${isRealParkName}, Raw HTML: ${$(columns[0]).html()?.substring(0, 100)}`);
      
      // Process images - try both column 0 and column 1
      let imageUrl = '';
      const imageCols = [columns[1], columns[0]]; // Try column 1 first, then column 0
      
      for (const col of imageCols) {
        const imageTag = $(col).find('img').first();
        if (imageTag.length) {
          // Get the src attribute and convert to full URL if needed
          let src = imageTag.attr('src') || '';
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (!src.startsWith('http')) {
            src = 'https://' + src;
          }
          
          // Get full image URL instead of thumbnail
          // Wikipedia thumbnails typically have /thumb/ in the path and end with a size specification like /200px-filename.jpg
          src = src.replace(/\/thumb\//, '/').replace(/\/\d+px-([^\/]+)$/, '/$1');
          
          imageUrl = src;
          break; // Stop once we find an image
        }
      }
      
      // Extract state information
      let state = '';
      // Try to get the state from a link first
      const stateLinks = $(columns[2]).find('a');
      if (stateLinks.length) {
        // Collect all state names in case there are multiple
        const states: string[] = [];
        stateLinks.each((i, link) => {
          const linkText = $(link).text().trim();
          if (linkText && !linkText.match(/^\[\d+\]$/)) { // Skip footnote references
            states.push(linkText);
          }
        });
        state = states.join(', ');
      }
      
      // Fallback to the entire cell text if no links were found
      if (!state) {
        state = $(columns[2]).text().trim().replace(/\[\d+\]/g, '').trim();
      }
      
      // Extract year established
      let yearEstablished = 0;
      // Try multiple columns for the date (typically column 4)
      const dateCols = [columns[4], columns[3], columns[5]];
      
      for (const col of dateCols) {
        if (!col) continue;
        
        const text = $(col).text().trim();
        // Look for a 4-digit year
        const yearMatch = text.match(/\d{4}/);
        if (yearMatch) {
          yearEstablished = parseInt(yearMatch[0]);
          break;
        }
      }
      
      // If no year was found but we have existing data, use that
      if (yearEstablished === 0) {
        const existingPark = nationalParksData.find(p => p.name === name);
        if (existingPark) {
          yearEstablished = existingPark.yearEstablished;
        }
      }
      
      // Extract description
      // For demonstration, we'll use the existing descriptions if available
      const existingPark = existingParkMap.get(name);
      const description = existingPark?.description || 
        `${name} National Park, located in ${state}, established in ${yearEstablished}.`;
      
      // Determine park type (using existing data if available)
      const parkType = existingPark?.parkType || "forest";
      
      // Create park object with imageUrl 
      // Using type assertion to add the imageUrl property
      const park: Park = {
        id: index + 1,
        name,
        description,
        state,
        yearEstablished,
        rating: 1500, // Default ELO rating
        parkType,
        imageUrl
      } as Park & { imageUrl: string };
      
      parks.push(park);
      console.log(`Processed park: ${name}`);
    });
    
    console.log(`Found ${parks.length} parks.`);
    
    // Write the data to a file
    const outputData = `import { Park } from "@shared/schema";

// National parks data with initial ELO ratings of 1500
export const nationalParksData: Park[] = ${JSON.stringify(parks, null, 2)};`;
    
    fs.writeFileSync(path.join(__dirname, '../server/parks-updated.ts'), outputData);
    console.log('Parks data has been written to server/parks-updated.ts');
    
  } catch (error) {
    console.error('Error fetching or processing parks data:', error);
  }
}

// Run the function
fetchNationalParks().catch(console.error);