/**
 * Movies example
 * Create a list of banner images using a premade template
 * Complete tutorial can be found here 
 */
const axios = require('axios');
const moviesList = require('./moviesList');

/**
 * Script configuration
 */

// Adrapid API base url
const adrapidBaseUrl = 'https://api.adrapid.com';

// Adrapid template id to be used for banner creation.
const templateId = 'b75e7999-8ac8-4a00-8781-eaef565f1f23';

// User API token, can be found in account page
const token = 'YOUR_API_TOKEN';

// delay between checks for banner status changes
const pollingDelay = 300;

// amount of banners to create
const bannersCount = 1;

// Modes to create banners, valid modes are html5, png, jpeg, webp and video
const modes = {
  png: true
}

// Add authentication to axios requests
axios.defaults.headers.common = { 'Authorization': `Bearer ${token}` }

console.time('bannerCreation');

/**
 * Function to create banners. Reads from csv file, creating banners with the content of the csv file using the giving template and modes.
 */
const createBanners = ({ templateId, modes, movie }) => {
  const overrides = {
    Title_text_1: {
      text: movie.Title
    },
    Subtitle_text_1: {
      text: `${movie["Runtime (Minutes)"]} min | ${movie.Genre}`
    },
    // Custom image url can be used
    Body_img_1: {
      //url: "IMG_URL"
    },
    Body_text_1: {
      text: movie.Description
    },
    Button_text_1: {
      text: movie.Metascore
    },
    Body_text_2: {
      text: `Director: ${movie.Director} | Stars: ${movie.Actors}`
    },
    Button_text_2: {
      text: movie.Rating
    }
  }
  return axios.post(`${adrapidBaseUrl}/banners`, {
    sizeIds: 'all',
    overrides,
    templateId,
    modes,
  }).then(response => response.data);
}

/**
 * Check if banner is ready, if its not ready then wait for pollingDelay and check again
 */
const checkBannerReady = id => {
  return axios.get(`${adrapidBaseUrl}/banners/${id}`).then(response => {
    const banner = response.data;
    if (banner.status == 'ready') return banner;
    if (banner.status == 'failed') { throw new Error('Banner creation failed') };
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(checkBannerReady(id));
      }, pollingDelay);
    });
  });
}

/**
 * Check sequentially for a list of banners to be ready 
 */
const checkBannersReady = async banners => {
  const readyBanners = [];
  for (const banner of banners) {
    const readyBanner = await checkBannerReady(banner.id);
    readyBanners.push(readyBanner);
  }
  return readyBanners;
};


/**
 * Create banners and check for ready status. When done print the result.
 */
const creatingBanners = moviesList.get({ limit: bannersCount }).map(movie => createBanners({ movie, templateId, modes }));
Promise.all(creatingBanners).then(banners => {
  console.log('Banner jobs started');
  return checkBannersReady(banners);
}).then(readyBanners => {
  for (const banner of readyBanners) {
    console.log(`banner ${banner.name} ready. Files:`);
    for (const bannerFile of banner.files) {
      console.log({
        name: bannerFile.name,
        type: bannerFile.type,
        size: bannerFile.size,
        url: bannerFile.url,
        width: bannerFile.width,
        height: bannerFile.height
      })
    }
  }
  console.timeEnd('bannerCreation');
}).catch(err => {
  console.error(err);
})