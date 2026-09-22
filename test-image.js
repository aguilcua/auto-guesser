// test-images.js

// Add your manually curated/stripped names here to test them
const testCars = [
    "Hyundai Elantra N"

];

async function testWikiImage(carName) {
  // Using your exact Wikimedia Commons Action API query
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(carName)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
  
  try {
    const response = await fetch(commonsUrl);
    const data = await response.json();
    
    // Exact parsing logic from your Next.js route
    if (!data.query || !data.query.pages) {
      console.log(` FAILED  | ${carName.padEnd(25)} -> No results found.`);
      return;
    }

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const pageData = pages[pageId];

    if (pageData.imageinfo && pageData.imageinfo[0].url) {
      console.log(` SUCCESS | ${carName.padEnd(25)} -> ${pageData.imageinfo[0].url}`);
    } else {
      console.log(` FAILED  | ${carName.padEnd(25)} -> Result found, but no URL.`);
    }
  } catch (error) {
    console.log(` ERROR   | ${carName.padEnd(25)} -> Request failed: ${error.message}`);
  }
}

async function runTests() {
  console.log("Starting Wikimedia Commons Image Tests...\n");
  for (const car of testCars) {
    await testWikiImage(car);
    // 200ms delay to prevent Wikimedia rate-limiting
    await new Promise(resolve => setTimeout(resolve, 200)); 
  }
  console.log("\nDone!");
}

runTests();