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
    
    // Use a CORS proxy to avoid CORS issues
    // You may need to replace this with a working CORS proxy
    const corsProxyUrl = 'https://corsproxy.io/?';
    const apodUrl = 'https://apod.nasa.gov/apod/astropix.html';
    
    // Fetch the APOD page HTML through the CORS proxy
    const response = await fetch(corsProxyUrl + encodeURIComponent(apodUrl));
    const html = await response.text();
    
    // Log the first part of the response for debugging
    console.log('Response preview:', html.substring(0, 500));
    
    // Extract the image URL using a more flexible regex pattern
    // This pattern looks for image tags with various attributes
    const imgRegex = /<img\s+[^>]*src=["']([^"']*\/image\/[^"']*)["'][^>]*>/i;
    let match = html.match(imgRegex);
    
    // If the primary regex fails, try a broader pattern
    if (!match) {
      const backupRegex = /<a\s+[^>]*href=["']([^"']*\.jpg)["'][^>]*>/i;
      match = html.match(backupRegex);
    }
    
    if (match && match[1]) {
      let imageUrl = match[1];
      
      // Make sure the URL is absolute
      if (imageUrl.startsWith('/')) {
        imageUrl = 'https://apod.nasa.gov' + imageUrl;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = 'https://apod.nasa.gov/apod/' + imageUrl;
      }
      
      console.log('Found APOD image URL:', imageUrl);
      
      // Cache the image URL and timestamp
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        imageUrl: imageUrl,
        timestamp: now
      }));
      
      setBackgroundImage(imageUrl);
    } else {
      console.error('Could not find image in APOD page');
      // Try a direct approach - often the image is at this standard URL pattern
      const today = new Date();
      const year = today.getFullYear().toString().substring(2); // Get last 2 digits of year
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      // Try the standard APOD URL pattern for today's image
      const directImageUrl = `https://apod.nasa.gov/apod/image/${year}${month}/${year}${month}${day}.jpg`;
      console.log('Trying direct URL pattern:', directImageUrl);
      
      // Test if the image exists
      try {
        const testImg = new Image();
        testImg.onload = function() {
          console.log('Direct URL image found');
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            imageUrl: directImageUrl,
            timestamp: now
          }));
          setBackgroundImage(directImageUrl);
        };
        testImg.onerror = function() {
          console.log('Direct URL image not found, falling back to default');
          fallbackToDefaultBackground();
        };
        testImg.src = directImageUrl;
      } catch (err) {
        console.error('Error testing direct image URL:', err);
        fallbackToDefaultBackground();
      }
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
  
  // Also add a background image directly to the body as a fallback method
  document.body.style.backgroundImage = `var(--imgcol), url('${url}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
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
