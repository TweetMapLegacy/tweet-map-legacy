const express = require('express');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter');
const User = require('../database/user.js');
const app = require('./server');
app.use(
  require('express-session')({
    secret: 'han shot first',
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: 'https://tweet-heat-map.herokuapp.com/auth/twitter/callback',
    },
    (token, tokenSecret, profile, cb) => {
      User.findOrCreate({twitterId: profile.id}, (err, user) => cb(err, user));
    },
  ),
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

app.get('/auth/loggedin', (req, res) => {
  if(req.isAuthenticated()){
     User.sessionCheck(req.sessionID).then(user => {
       res.send({loggedIn: true, history: user.history});
     }).catch(console.error);
  }
  else res.send({loggedIn: false});
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get(
  '/auth/twitter/callback*',
  passport.authenticate('twitter', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    const user = req._passport.session.user;
    User.sessionAdd(user, req.sessionID);
    res.redirect('/');
  },
);

