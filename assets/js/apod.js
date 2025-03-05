// ┌─┐┌─┐┌─┐┌┬┐  ┌─┐┌─┐┌┬┐┌─┐┬ ┬┌─┐┬─┐
// ├─┤├─┘│ │ ││  ├┤ ├┤  │ │  ├─┤├┤ ├┬┘
// ┴ ┴┴  └─┘─┴┘  └  └─┘ ┴ └─┘┴ ┴└─┘┴└─
// Function to fetch NASA's Astronomy Picture of the Day

// Create a cache system with date-based validation
const CACHE_KEY = 'apod_cache';

async function fetchAPODImage() {
  // Get today's date in string format YYYY-MM-DD for comparison
  const today = new Date();
  const currentDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Load the cached data
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  
  // Check if we already have today's image
  if (cachedData.date === currentDateStr && cachedData.imageUrl) {
    console.log('Using today\'s cached APOD image from', currentDateStr);
    setBackgroundImage(cachedData.imageUrl);
    return;
  }
  
  // If we don't have today's image, we need to fetch a new one
  console.log('Need to fetch new APOD image for', currentDateStr);
  
  try {
    // Use a CORS proxy to avoid CORS issues
    const corsProxyUrl = 'https://corsproxy.io/?';
    const apodUrl = 'https://apod.nasa.gov/apod/astropix.html';
    
    // Add a random query parameter to prevent caching
    const cacheBuster = `?nocache=${Math.random()}`;
    
    // Fetch the APOD page HTML through the CORS proxy
    const response = await fetch(corsProxyUrl + encodeURIComponent(apodUrl + cacheBuster));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract the image URL using a flexible regex pattern
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
      
      // Download, downsample, and cache the image
      downloadAndProcessImage(imageUrl, currentDateStr);
    } else {
      console.error('Could not find image in APOD page');
      tryAlternativeApproaches(currentDateStr);
    }
  } catch (error) {
    console.error('Error fetching APOD:', error);
    tryAlternativeApproaches(currentDateStr);
  }
}

function tryAlternativeApproaches(dateStr) {
  // Try direct URL construction based on date
  const today = new Date();
  const year = today.getFullYear().toString().substring(2); // Get last 2 digits
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Try the standard APOD URL pattern
  const directImageUrl = `https://apod.nasa.gov/apod/image/${year}${month}/${year}${month}${day}.jpg`;
  console.log('Trying direct URL pattern:', directImageUrl);
  
  // Test if this image exists
  const testImg = new Image();
  testImg.onload = function() {
    console.log('Direct URL image found');
    downloadAndProcessImage(directImageUrl, dateStr);
  };
  testImg.onerror = function() {
    console.log('Direct URL image not found, falling back to default');
    fallbackToDefaultBackground(dateStr);
  };
  testImg.src = directImageUrl;
}

function downloadAndProcessImage(imageUrl, dateStr) {
  const img = new Image();
  img.crossOrigin = "Anonymous";  // For CORS-enabled processing
  
  img.onload = function() {
    console.log('Image loaded, processing...');
    
    // Create a canvas for downsampling
    const canvas = document.createElement('canvas');
    
    // Determine target dimensions (max width/height of 1200px)
    const MAX_DIMENSION = 1200;
    let width = img.width;
    let height = img.height;
    
    // Calculate new dimensions while maintaining aspect ratio
    if (width > height && width > MAX_DIMENSION) {
      height = Math.round(height * (MAX_DIMENSION / width));
      width = MAX_DIMENSION;
    } else if (height > MAX_DIMENSION) {
      width = Math.round(width * (MAX_DIMENSION / height));
      height = MAX_DIMENSION;
    }
    
    // Set canvas dimensions and draw resized image
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to compressed JPEG data URL with 85% quality
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Cache the processed image with today's date
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        imageUrl: dataUrl,
        date: dateStr,
        width: width,
        height: height
      }));
      
      // Set as background
      setBackgroundImage(dataUrl);
      console.log('Image processed and cached successfully for', dateStr);
    } catch (e) {
      console.error('Error creating data URL:', e);
      // If dataURL fails, try using the original image
      setBackgroundImage(imageUrl);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        imageUrl: imageUrl,
        date: dateStr
      }));
    }
  };
  
  img.onerror = function() {
    console.error('Error loading image for processing');
    fallbackToDefaultBackground(dateStr);
  };
  
  // Start loading the image
  img.src = imageUrl;
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

function fallbackToDefaultBackground(dateStr) {
  console.log('Using default background image');
  // Use the default background from config
  const defaultBackground = CONFIG.defaultBackground || 'https://apod.nasa.gov/apod/image/2409/Bat_Taivalnaa_4200.jpg';
  
  // If it's a URL, try to process it
  if (defaultBackground.startsWith('http')) {
    downloadAndProcessImage(defaultBackground, dateStr);
  } else {
    // If it's already a data URL or something else, use directly
    setBackgroundImage(defaultBackground);
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      imageUrl: defaultBackground,
      date: dateStr
    }));
  }
}

// Function to check if user has visited today already
function checkLastVisit() {
  const lastVisitKey = 'apod_last_visit';
  const today = new Date();
  const currentDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Get the last visit date
  const lastVisitDate = localStorage.getItem(lastVisitKey) || '';
  
  // Update the last visit date
  localStorage.setItem(lastVisitKey, currentDateStr);
  
  // If the last visit was on a different day, or first visit
  if (lastVisitDate !== currentDateStr) {
    console.log('First visit today, forcing APOD refresh');
    // Clear existing cache to force a new fetch
    localStorage.removeItem(CACHE_KEY);
  }
  
  // Always fetch APOD image (will use cache if valid for today)
  fetchAPODImage();
}

// Run our APOD fetcher when the page loads
window.addEventListener('load', checkLastVisit);

// Also check when the page becomes visible again (user returns to tab)
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    checkLastVisit();
  }
});
