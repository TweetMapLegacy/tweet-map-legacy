// Commenting out the code below and running this
// file will populate the database with each state's top keywords
const mongoose = require('mongoose');
const dotenv = require('dotenv').config({ silent: true });
const _ = require('underscore');
const bodyParser = require('body-parser');
const axios = require('axios');
const getSentimentFromTweets = require('./sentiment');
const country_conversion = require('../client/src/components/country-codes').country_conversion;


mongoose.Promise = global.Promise;
const mongoPath = process.env.MONGO_URL;
mongoose.connect(mongoPath);
const db = mongoose.connection;
const Schema = mongoose.Schema;

db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', () => {
  console.log('Connection Established.');
});


//
// ─── MODELS ─────────────────────────────────────────────────────────────────────
//
const nationalTrend = mongoose.model(
  'NationalTrend',
  new Schema({ trend: String, rank: Number, date: String }), 'NationalTrends',
);

const globalTrend = mongoose.model(
  'GlobalTrend',
  new Schema({ trend: String, rank: Number, date: String }), 'GlobalTrends',
);

const stateTweet = mongoose.model(
  'StateTweet',
  new Schema({ state: String, text: String }), 'StateTweets',
);

const stateKeyword = mongoose.model(
  'StateKeyword',
  new Schema({}), 'statekeywords',
);

const Tweet = mongoose.model(
  'Tweet',
  new Schema({
    place: String,
    state: String,
    country: String,
    text: String,
    username: String,
    createdAt: Date,
    latitude: Number,
    longitude: Number,
    radius: Number
  }), 'Tweets',
);

//
// ─── SAVE TO DB ─────────────────────────────────────────────────────────────────
//
const saveStateTweet = (data) => {
  stateTweet(data).save();
};

const saveTweet = (data) => {
  Tweet(data).save();
};

const saveNationalTrend = (data) => {
  nationalTrend(data).save();
};

const saveGlobalTrend = (data) => {
  globalTrend(data).save();
};


//
// ─── MANIPULATE DATA ────────────────────────────────────────────────────────────
//

const getBubbles = (query, callback) => {
  Tweet.find({text: { $regex: query, $options: "i" }}, (err, data) => {
    if (err) {
      callback(err);
    } else {
      callback(null, data);
    }
  });
}

const getNationalTrends = () => nationalTrend.find({ rank: { $lte: 15 } }).select('trend');

const getStateKeywords = () => {
  stateKeyword.find({});
};

const getStatePercentages = async (keyword) => {
  const percents = await Tweet.aggregate([
    {
      $group: {
        _id: '$state',
        state: { $first: '$state' },
        totalCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $unwind: '$text',
    },
    {
      $match: {
        text: { $regex: keyword.word, $options: 'i' },
      },
    },
    {
      $group: {
        _id: '$state',
        state: { $first: '$state' },
        totalCount: { $first: '$totalCount' },
        matchCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $project: {
        _id: 0,
        state: 1,
        text: 1,
        percent: {
          $multiply: [{ $divide: ['$matchCount', '$totalCount'] }, 100],
        },
      },
    }, 
  ]).allowDiskUse(true);
  
  const percentsObj = {};
  for (const val of percents) {
    percentsObj[val.state] = {
      fillKey: Math.round(val.percent * 100) / 100,
      text: val.text.slice(0, 5),
    };
  }
  
  return percentsObj;
};

const getCountryPercentages = async (keyword) => {
  const percents = await Tweet.aggregate([
    {
      $group: {
        _id: '$country',
        country: { $first: '$country' },
        totalCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $unwind: '$text',
    },
    {
      $match: {
        text: { $regex: keyword.word, $options: 'i' },
      },
    },
    {
      $group: {
        _id: '$country',
        state: { $first: '$country' },
        totalCount: { $first: '$totalCount' },
        matchCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $project: {
        _id: 0,
        state: 1,
        text: 1,
        percent: {
          $multiply: [{ $divide: ['$matchCount', '$totalCount'] }, 100],
        },
      },
    },
  ]).allowDiskUse(true);

  const percentsObj = {};
  for (const val of percents) {
    let countryCode = country_conversion[val.state];
    percentsObj[countryCode] = {
      fillKey: Math.round(val.percent * 100) / 100,
      text: val.text.slice(0, 5),
    };
  }
  return percentsObj;
};

const getStateSentiments = async (keyword) => {
  const stateTweets = await Tweet.aggregate([
    {
      $match: {
        country: 'US',
      },
    },
    {
      $group: {
        _id: '$state',
        state: { $first: '$state' },
        totalCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $unwind: '$text',
    },
    {
      $match: {
        text: { $regex: keyword.word, $options: 'i' },
      },
    },
    {
      $group: {
        _id: '$state',
        state: { $first: '$state' },
        totalCount: { $first: '$totalCount' },
        matchCount: { $sum: 1 },
        text: { $push: '$text' },
      },
    },
    {
      $project: {
        _id: 0,
        state: 1,
        text: 1,
      },
    },
  ]);

  console.log('STATETWEETS OBJECT', stateTweets.map(el => [el.state, el.text.length]));

  const sentimentsObj = {};
  const promiseArr = [];
  stateTweets.forEach((stateObj) => {
    promiseArr.push(getSentimentFromTweets(stateObj.text)
      .then((results) => {
        const sentiment = results[0] ?
          JSON.parse(results[0].replace(/\n/g, '')).sentiment.document.score
          : 0;
        sentimentsObj[stateObj.state] = {
          fillKey: sentiment,
        };
      })
      .catch(console.log));
  });

  return axios.all(promiseArr)
    .then(() => sentimentsObj);
};

module.exports = {
  saveTweet,
  saveStateTweet,
  saveNationalTrend,
  saveGlobalTrend,
  getBubbles,
  getNationalTrends,
  getStateKeywords,
  getStatePercentages,
  getCountryPercentages,
  getStateSentiments,
};
