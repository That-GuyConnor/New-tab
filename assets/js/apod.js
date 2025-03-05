// ┌─┐┌─┐┌─┐┌┬┐  ┌─┐┌─┐┌┬┐┌─┐┬ ┬┌─┐┬─┐
// ├─┤├─┘│ │ ││  ├┤ ├┤  │ │  ├─┤├┤ ├┬┘
// ┴ ┴┴  └─┘─┴┘  └  └─┘ ┴ └─┘┴ ┴└─┘┴└─
// Function to fetch NASA's Astronomy Picture of the Day

// Create a cache system to avoid fetching the image on every page load
const CACHE_KEY = 'apod_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function fetchAPODImage() {
  // Check if we have a valid cached image
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  const now = new Date().getTime();
  
  // If we have a valid cache, use it
  if (cachedData.timestamp && (now - cachedData.timestamp < CACHE_EXPIRY) && cachedData.imageUrl) {
    console.log('Using cached APOD image');
    setBackgroundImage(cachedData.imageUrl);
    return;
  }
  
  try {
    console.log('Fetching new APOD image');
    // Use a CORS proxy if you're having CORS issues
    // const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const apodUrl = 'https://apod.nasa.gov/apod/astropix.html';
    
    // Fetch the APOD page HTML
    const response = await fetch(apodUrl);
    const html = await response.text();
    
    // Extract the image URL using a simple regex pattern
    // This looks for an image tag in the HTML
    const imgRegex = /<img src="(image\/.*?)".*?>/i;
    const match = html.match(imgRegex);
    
    if (match && match[1]) {
      const imageUrl = 'https://apod.nasa.gov/apod/' + match[1];
      
      // Cache the image URL and timestamp
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        imageUrl: imageUrl,
        timestamp: now
      }));
      
      setBackgroundImage(imageUrl);
    } else {
      console.error('Could not find image in APOD page');
      // Fall back to the default background or last successful image
      fallbackToDefaultBackground();
    }
  } catch (error) {
    console.error('Error fetching APOD:', error);
    fallbackToDefaultBackground();
  }
}

function setBackgroundImage(url) {
  // Update CSS variable for background image
  document.documentElement.style.setProperty('--imgbg', `url('${url}')`);
  
  // Make sure image background is enabled
  document.body.classList.add('withImageBackground');
}

function fallbackToDefaultBackground() {
  // Check if we have a previously cached image
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  
  if (cachedData.imageUrl) {
    // Use the last successful image even if cache expired
    setBackgroundImage(cachedData.imageUrl);
  } else {
    // Use the default background from config
    const defaultBackground = CONFIG.defaultBackground || 'https://apod.nasa.gov/apod/image/2409/Bat_Taivalnaa_4200.jpg';
    setBackgroundImage(defaultBackground);
  }
}

// Initialize the APOD background
document.addEventListener('DOMContentLoaded', fetchAPODImage);
