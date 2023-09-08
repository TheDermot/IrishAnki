const express = require('express');

const router = express.Router();
// const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');
const client = createClient({
  // url: 'file:db.sql',
  url: 'libsql://irish-anki-thedermot.turso.io',
  authToken: process.env.token,
});
router.get('/', function (req, res) {
  if (!req.user) {
    res.render('index', {
      user: {},
    });
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
router.get('/:id/known_words', async function (req, res) {
  if (!req.user) {
    // If the user is not authenticated, redirect to the log in page
    res.redirect('/auth/login');
  } else {
    // If the user is authenticated, render the home page with user data
    const userId = req.params.id;
    const initialSortMode = 'default';

    // const db = new sqlite3.Database('database.db');
    const wordsExist = "SELECT name FROM sqlite_master WHERE type='table' AND name='words'";
    try {
      const rs = await client.execute(wordsExist);
      console.log('check words table is filled', rs);
      if (rs.rows.length > 0) {
        console.log("The 'words' table exists.");
        const rs2 = await client.execute({
          sql: 'select * from words where googleId = ?',
          args: [userId],
        });
        // Render the EJS file and pass the fetched words and user info as data
        console.log('select all words', rs2);
        res.render('words', {
          user: {
            id: req.user.id,
            googleId: req.user.googleId,
            name: req.user.displayName,
          },
          words: rs2.rows,
          initialSortMode,
        });
      } else {
        console.log("The 'words' table does not exist/is empty");
        const wordTemp = {};
        res.render('words', {
          user: {
            id: req.user.id,
            googleId: req.user.googleId,
            name: req.user.displayName,
          },
          words: wordTemp,
          initialSortMode,
        });
      }
    } catch (err) {
      console.log(err);
    }

    // db.get(wordsExist, [], (err, row) => {
    //   if (err) {
    //     console.error(err.message);
    //     return;
    //   }

    //   if (row) {
    //     console.log("The 'words' table exists.");
    //     db.all('SELECT * FROM words WHERE googleId = ?', [userId], (err, rows) => {
    //       if (err) {
    //         // Handle any errors
    //         console.error(err);
    //         res.status(500).send('Internal Server Error');
    //       } else {
    //         // Render the EJS file and pass the fetched words and user info as data
    //         console.log(rows, 'rooooooooows');
    //         res.render('words', {
    //           user: {
    //             id: req.user.id,
    //             googleId: req.user.googleId,
    //             name: req.user.displayName,
    //           },
    //           words: rows,
    //           initialSortMode,
    //         });
    //       }
    //     });
    //   } else {
    //     console.log("The 'words' table does not exist.");
    //     const wordTemp = {};
    //     res.render('words', {
    //       user: {
    //         id: req.user.id,
    //         googleId: req.user.googleId,
    //         name: req.user.displayName,
    //       },
    //       words: wordTemp,
    //       initialSortMode,
    //     });
    //   }
    // });
  }
});

module.exports = router;
