const express = require('express');

const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

router.get('/', function (req, res) {
  //create home page later
  if (!req.user) {
    // If the user is not authenticated, redirect to the login page
    res.redirect('/auth/login');
  } else {
    console.log(req);
    res.render('index', {
      user: {
        id: req.user.id,
        googleId: req.user.googleId,
        name: req.user.displayName,
      },
    });
  }
});
router.get('/:id/known_words', function (req, res) {
  if (!req.user) {
    // If the user is not authenticated, redirect to the login page
    res.redirect('/auth/login');
  } else {
    // If the user is authenticated, render the home page with user data
    const userId = req.params.id;
    const db = new sqlite3.Database('database.db');
    const wordsExist = "SELECT name FROM sqlite_master WHERE type='table' AND name='words'";

    db.get(wordsExist, [], (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }

      if (row) {
        console.log("The 'words' table exists.");
        db.all('SELECT * FROM words WHERE googleId = ?', [userId], (err, rows) => {
          if (err) {
            // Handle any errors
            console.error(err);
            res.status(500).send('Internal Server Error');
          } else {
            // Render the EJS file and pass the fetched words and user info as data
            console.log(rows, 'rooooooooows');
            const initialSortMode = 'default';
            res.render('words', {
              user: {
                id: req.user.id,
                googleId: req.user.googleId,
                name: req.user.displayName,
              },
              words: rows,
              initialSortMode,
            });
          }
        });
      } else {
        console.log("The 'words' table does not exist.");
        res.render('words', {
          user: {
            id: req.user.id,
            googleId: req.user.googleId,
            name: req.user.displayName,
          },
          words: row,
        });
      }
    });
  }
});

module.exports = router;
