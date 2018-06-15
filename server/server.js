const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const db = require('../database/database');
const { cronJob } = require('../database/tweetsStream');

const app = express();


//
// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────────
//
app.use(express.static(`${__dirname}/../client/dist/`));
app.use(bodyParser.json());
app.use(morgan('dev'));

cronJob.start();


//
// ─── NATIVE ENDPOINTS ───────────────────────────────────────────────────────────
//
app.get('/nationaltrends', async (req, res) => {
  const trends = await db.getNationalTrends();
  res.send(trends);
});

app.get('/keywords', async (req, res) => {
  const keywords = await db.getStateKeywords();
  res.send(keywords);
});

app.post('/statepercentages', async (req, res) => {
  const percents = await db.getStatePercentages(req.body);
  console.log('PERCENT DATA', percents);
  res.send(percents);
});

app.post('/statesentiments', (req, res) => {
  db.getStateSentiments(req.body)
    .then((sentiments) => {
      console.log('SENTIMENT DATA', sentiments);
      res.send(sentiments);
    })
    .catch(console.log);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${process.env.PORT || 3000}!`);
});

