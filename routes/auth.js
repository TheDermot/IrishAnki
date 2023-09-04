const express = require('express');
const router = express.Router();
const passport = require('passport');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE, err => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (googleId TEXT PRIMARY KEY, displayName TEXT)');
});
// const userDb = 'CREATE TABLE IF NOT EXISTS users (username, password, id INTEGER PRIMARY KEY AUTOINCREMENT)';
// const createUser = 'INSERT INTO users (username, password, id) VALUES(?,?,?)';
// db.run(userDb);
const env = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      db.get('SELECT * FROM users WHERE googleId = ?', [profile.id], (err, row) => {
        if (err) return done(err);
        if (!row) {
          db.run('INSERT INTO users (googleId, displayName) VALUES (?, ?)', [profile.id, profile.displayName], err => {
            if (err) return done(err);
            db.get('SELECT last_insert_rowid() AS id', (err, row) => {
              if (err) return done(err);
              return done(null, { googleId: profile.id, displayName: profile.displayName });
            });
          });
        } else {
          return done(null, row);
        }
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  console.log(user);
  done(null, user.googleId);
});

passport.deserializeUser(function (googleId, done) {
  db.get('SELECT * FROM users WHERE googleId = ?', googleId, function (err, row) {
    if (err) {
      return done(err);
    }
    done(null, row);
  });
});

router.get('/register', function (req, res) {
  res.render('register');
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }, (req, res) => {})
);

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  console.log(req.user);
  res.redirect(`/`);
});

router.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    console.log('hello');
    res.send(`<html><body><p>Hello, ${req.user.displayName}!</p><p>Your Google ID is: ${req.user.googleId}</p></body></html>`);
  } else {
    res.redirect('/');
  }
});

router.get('/login', function (req, res) {
  res.render('login', { message: req.flash('error') });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: 'login', failureFlash: true }));

router.get('/logout', function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Goodbye!');
    res.redirect('/');
  });
});

//middleware for future routes to check if logged in
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// app.get('/', isAuthenticated, function (req, res) {
//   res.send('Welcome, ' + req.user.username);
// });

module.exports = router;
