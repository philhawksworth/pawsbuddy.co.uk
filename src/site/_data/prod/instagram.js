const axios  = require('axios');
const fs     = require("fs");

require('dotenv').config()
const { INSTAGRAM_AUTH } = process.env;
var url = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${INSTAGRAM_AUTH}`;


// Handy to save the results to a local file
// to prime the dev data source
const seed = (data, path) => {
  if(process.env.ELEVENTY_ENV == 'seed') {
    fs.writeFile(path, JSON.stringify(data), err => {
      if(err) {
        console.log(err);
      } else {
        console.log("Instagram content seeded for dev.");
      }
    });
  }
}

module.exports = () => {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then(response => {
        seed(response.data.data, __dirname + '/../dev/instagram.json')
        resolve(response.data.data);
      })
      .catch(err => {
        reject(err);
      });
  })
}
