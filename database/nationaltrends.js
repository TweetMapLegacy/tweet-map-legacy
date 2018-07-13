// Run this file to generate the top 50 Twitter trends, stored in national-trends.json
// That file will be importable

const axios = require('axios');
const fs = require('fs');
const db = require('./database.js');

axios.get('https://api.twitter.com/1.1/trends/place.json?id=1', {
  headers: {
    Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAAKhl6QAAAAAA7ryEMrycuJRLTZbyiyZmAJ6%2F8HM%3DgeDvD8L50Q0TgKP7cQJge4PLS26U7YvNlnlruVZ4n1HOo0TWJQ',
  },
}).then((res) => {
  formatData(res.data[0].trends);
}).catch((err) => {
  console.log(err.response.data);
});

const filePath = './database/national-trends.json';
let count = 0;
const today = new Date(Date.now()).toDateString();

const formatData = (data) => {
  for (const trend of data) {
    count++;

    db.saveGlobalTrend({
      trend: trend.name,
      rank: count,
      date: today,
    });

    // await fs.appendFileSync(filePath, JSON.stringify({
    //   trend: trend.name,
    //   rank: count,
    //   date: today
    // }));

    // await fs.appendFileSync(filePath, '\n');
  }
};
