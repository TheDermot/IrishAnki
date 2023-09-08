const express = require('express');
const router = express.Router();

// const sqlite3 = require('sqlite3').verbose();

// Open the database connection
// const db = new sqlite3.Database('database.db');

const { createClient } = require('@libsql/client');
const client = createClient({
  // url: 'file:db.sql',
  url: 'libsql://irish-anki-thedermot.turso.io',
  authToken: process.env.authToken,
});

router.post('/', async (req, res) => {
  console.log(req);
  console.log(req.headers.googleid);
  const userGoogleId = req.headers.googleid || req.user.googleId;
  const newWord = req.body.text;
  const definition = req.body.definition;
  const grammar = req.body.grammar;
  const known = req.body.known;
  console.log(newWord, userGoogleId);
  // // Create the words table
  // const sql1 = `CREATE TABLE IF NOT EXISTS words (
  //   id INTEGER PRIMARY KEY AUTOINCREMENT,
  //   googleId INTEGER NOT NULL,
  //   word TEXT NOT NULL,
  //   definition TEXT NOT NULL,
  //   grammar TEXT NOT NULL,
  //   known TEXT,
  //   editUpdated BOOLEAN DEFAULT 1,
  //   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  //   FOREIGN KEY (googleId) REFERENCES users (googleId)
  // )`;
  let success = true; //initialize to true
  let reason = ''; // Initialize reason for failure

  // db.run(sql1, function (err) {
  //   if (err) {
  //     success = false;
  //     reason = 'Table creation error'; // Set the reason for failure
  //     res.type('application/xml');
  //     res.send(`<response><success>${success}</success><reason>${reason}</reason></response>`);
  //     console.log('sent response');
  //     console.error('error 1', err.message);
  //     return;
  //   } else {
  //     console.log('table words');
  //   }
  // });
  const checkWordExist = `SELECT COUNT(*) AS count FROM words WHERE googleId = ? AND word = ?`;
  try {
    const rs = await client.execute({
      sql: checkWordExist,
      args: [userGoogleId, newWord],
    });
    console.log('count query', rs.rows[0].count);
    if (rs.rows[0].count === 0) {
      console.log(userGoogleId, newWord, definition, grammar, 's');
      const insertWord = 'insert into words(word, definition, grammar, googleId, known) values(?, ?, ?, ?, ?)';
      const rs2 = await client.execute({
        sql: insertWord,
        args: [newWord, definition, grammar, userGoogleId, known],
      });
      console.log('insert query', rs2);
      console.log('added ' + newWord);
      const response = {
        success: true,
        reason: 'Submitted!',
      };
      res.status(200).json(response);
    } else {
      const response = {
        success: false,
        reason: `User has already added ${newWord}`,
      };
      res.status(400).json(response);
      console.log(`${userGoogleId} has already added ${newWord}`);
    }
  } catch (err) {
    const response = {
      success: false,
      reason: err.message,
    };
    res.status(500).json(response);
    console.error('Error:', err);
  }
  // db.get(checkWordExist, [userGoogleId, newWord], (err, row) => {
  //   if (err) {
  //     const response = {
  //       success: false,
  //       reason: err.message,
  //     };
  //     res.status(500).json(response);
  //     console.error('Error:', err.message);
  //     return;
  //   }
  //   if (row.count === 0) {
  //     // Insert the new word into the words table for the specified user
  //     const sql2 = `INSERT INTO words (word, definition, grammar, googleId, known) VALUES (?,?,?,?,?)`;
  //     db.run(sql2, [newWord, definition, grammar, userGoogleId, known], err => {
  //       if (err) {
  //         const response = {
  //           success: false,
  //           reason: err.message,
  //         };
  //         res.status(500).json(response);
  //         console.error(err.message);
  //         return;
  //       } else {
  //         console.log('added ' + newWord);
  //         const response = {
  //           success: true,
  //           reason: 'Submitted!',
  //         };
  //         res.status(200).json(response);
  //       }
  //     });
  //   } else {
  //     const response = {
  //       success: false,
  //       reason: `User has already added ${newWord}`,
  //     };
  //     res.status(400).json(response);
  //     console.log(`${userGoogleId} has already added ${newWord}`);
  //   }
  // });
});
router.post('/editTag', async (req, res) => {
  console.log(req);
  const { wordIds } = req.body;
  console.log(wordIds);

  const placeholders = wordIds.map(() => '?').join(',');
  const updateEditTagQuery = `UPDATE words SET editUpdated = 1 WHERE id IN (${placeholders})`;
  try {
    const rs = await client.execute({ sql: updateEditTagQuery, args: [...wordIds] });
    console.log(rs);
    return res.status(200).json({ message: 'editUpdated status updated successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred while updating editUpdated status' });
  }
  // db.run(updateEditTagQuery, [...wordIds], err => {
  //   if (err) {
  //     console.error('Error updating editUpdated status:', err.message);
  //     return res.status(500).json({ error: 'An error occurred while updating editUpdated status' });
  //   }
  //   return res.status(200).json({ message: 'editUpdated status updated successfully' });
  // });
});
//updates word
router.post('/:id', async (req, res) => {
  if (!req.user) {
    return res.status(500).json({ error: 'Not logged in' });
  }
  console.log('hhhi');
  const wordId = req.params.id;
  const { word, definition, grammar, known } = req.body;
  console.log(req);
  const userId = req.user.googleId;

  // Check if the word's current user ID matches the logged-in user's Google ID
  const checkQuery = 'SELECT googleId FROM words WHERE id = ?';
  const updateQuery = 'UPDATE words SET word = ?, definition = ?, grammar = ?, known = ?, editUpdated = 0 WHERE id = ?';

  try {
    const rs = await client.execute({ sql: checkQuery, args: [wordId] });
    console.log('check user', rs);
    if (rs.rows.length === 0 || rs.rows[0].googleId !== userId) {
      console.log(userId, row.googleId);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const rs2 = await client.execute({ sql: updateQuery, args: [word, definition, grammar, known, wordId] });
    console.log('update user', rs2);
    return res.status(200).json({ message: 'Word updated successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
  // db.get(checkQuery, [wordId], (err, row) => {
  //   if (err) {
  //     console.log('eeee');
  //     return res.status(500).json({ error: 'An error occurred' });
  //   }
  //   if (!row || row.googleId !== userId) {
  //     console.log(userId, row.googleId);
  //     return res.status(403).json({ error: 'Unauthorized' });
  //   }

  //   // Update the word's details
  //   const updateQuery = 'UPDATE words SET word = ?, definition = ?, grammar = ?, known = ?, editUpdated = 0 WHERE id = ?';
  //   db.run(updateQuery, [word, definition, grammar, known, wordId], err => {
  //     if (err) {
  //       console.log('sdsds');
  //       console.error(err);
  //       return res.status(500).json({ error: 'An error occurred while updating the word' });
  //     }
  //     return res.status(200).json({ message: 'Word updated successfully' });
  //   });
  // });
});

router.delete('/:id', async (req, res) => {
  const wordId = req.params.id;
  const userId = req.user.googleId;
  const checkUser = 'SELECT googleId FROM words WHERE id = ?';
  const deleteQuery = 'DELETE FROM words WHERE id = ?';

  try {
    const rs = await client.execute({ sql: checkUser, args: [wordId] });
    console.log('check user match word', rs);
    if (rs.rows[0].length === 0 || rs.rows[0].googleId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const rs2 = await client.execute({ sql: deleteQuery, args: [wordId] });
    console.log('delete match word', rs2);
    return res.status(200).json({ message: 'Word deleted successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred' });
  }

  // Check if the word's current user ID matches the logged-in user's Google ID
  // db.get(checkUser, [wordId], (err, row) => {
  //   if (err) {
  //     return res.status(500).json({ error: 'An error occurred' });
  //   }
  //   if (!row || row.googleId !== userId) {
  //     return res.status(403).json({ error: 'Unauthorized' });
  //   }

  //   // Delete the word from the database
  //   const deleteQuery = 'DELETE FROM words WHERE id = ?';
  //   db.run(deleteQuery, [wordId], err => {
  //     if (err) {
  //       console.error(err);
  //       return res.status(500).json({ error: 'An error occurred while deleting the word' });
  //     }
  //     return res.status(200).json({ message: 'Word deleted successfully' });
  //   });
  // });
});

module.exports = router;
