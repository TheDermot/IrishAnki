const express = require('express');
const session = require('express-session');
const path = require('path');
const ejsMate = require('ejs-mate'); //Express 4.x layout, partial and block template functions for the EJS template engine.
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport'); //authentication for express requests
require('dotenv').config();
const index_routes = require('./routes/index');
const auth_routes = require('./routes/auth');
const words_routes = require('./routes/words');
const flash = require('connect-flash');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

app.engine('ejs', ejsMate); //ejs template engine
app.set('views', path.join(__dirname, 'views')); //setting default view path, __dirname is the directory in which the currently executing script resides
app.set('view engine', 'ejs'); //so you can render templates

app.use(express.static('public'));
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const sessionConfig = {
  name: 'session',
  store: new SQLiteStore(),
  secret: 'sdadsasdas',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //secure: true // cookie only https
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //ms
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },

  //using memory store, only for dev purposes, goes away when we stop serv, will set to mongo
};
app.use(flash());

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session(sessionConfig));

//middleware that for every route if theres anything under the keywords it adds it to the local so templates can access it
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use(cors());

// Register routes
app.use('/', index_routes);
app.use('/auth', auth_routes);
app.use('/words', words_routes);

const sqlite3 = require('sqlite3').verbose();

// // Open the database connection
const db = new sqlite3.Database('database.db');

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
