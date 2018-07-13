const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const db = require('../database/database');
const { cronJobUS, cronJobWorld } = require('../database/tweetsStream');
const app = (module.exports = express());
const auth = require('./auth');
const User = require('../database/user');

//
// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────────
//
app.use(express.static(`${__dirname}/../client/dist/`));
app.use(bodyParser.json());
app.use(morgan('dev'));
cronJobUS.start();
cronJobWorld.start();

//
// ─── NATIVE ENDPOINTS ───────────────────────────────────────────────────────────
//
app.get('/nationaltrends', async (req, res) => {
  const trends = await db.getNationalTrends();
  res.send(trends);
});

app.get('/globaltrends', async (req, res) => {
  const trends = await db.getGlobalTrends();
  res.send(trends);
});

app.get('/keywords', async (req, res) => {
  const keywords = await db.getStateKeywords();
  res.send(keywords);
});

app.get('/bubbles/:query', (req, res) => {
  const { query } = req.params;
  db.getBubbles(query, (err, data) => {
    if (err) {
      res.status(404).end();
    } else {
      res.send(data);
    }
  });
});

app.post('/statepercentages', async (req, res) => {
  const percents = await db.getStatePercentages(req.body);
  res.send(percents);
});

app.post('/countrypercentages', async (req, res) => {
  const percents = await db.getCountryPercentages(req.body);
  res.send(percents);
});

app.post('/statesentiments', (req, res) => {
  db.getStateSentiments(req.body)
    .then(sentiments => {
      console.log('SENTIMENT DATA', sentiments);
      res.send(sentiments);
    })
    .catch(console.log);
});

app.post('/postterm', (req, res) => {
  console.log(req.sessionID);
  User.historyAdd(req.sessionID, req.body.term).then(res.send('done')).catch(console.error);
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${process.env.PORT || 3000}!`);
});

