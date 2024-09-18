const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ =require('lodash');
const mongoose = require("mongoose");
const path = require('path');
const session = require('express-session');
const passport = require('passport');
passportLocalMongoose = require('passport-local-mongoose')
const methodOverride = require('method-override');
const { stringify } = require("querystring");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }).single('file');
const app = express();
const pool = require('./db');
const fs = require("node:fs", "fs");
const mailgun = require('mailgun-js');



app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,

});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const homeStartingContent = "";
const aboutContent = " about zach";
const contactContent = "contact zach";

//ROUTES

//redirect home if not logged in
app.get('/', function (req,res){
  if(req.isAuthenticated()){
    res.redirect('/adminhome')

  }else{

    res.redirect('/home')
  }

})






app.get("/home", function(req,res){   
  res.render('home') 
});

app.get("/contact", function(req,res){
  res.render('contact')
});

app.get('/menu', function(req,res){
  res.render('menu')
});



app.get("/gracefulbowls/home", function(req,res){   
res.render('gracefulbowls-home') 
});

app.get("/gracefulbowls/contact", function(req,res){   
res.render('gracefulbowls-contact') 
});

app.get("/gracefulbowls/menu", function(req,res){   
res.render('gracefulbowls-menu') 
});



app.get("/scholarshipauditions/home", function(req,res){   
res.render('scholarshipauditions-home') 
});

app.get("/scholarshipauditions/founder", function(req,res){   
res.render('scholarshipauditions-founder') 
});

app.get("/scholarshipauditions/internship-program", function(req,res){   
res.render('scholarshipauditions-intern') 
});

app.get("/scholarshipauditions/research-influencers", function(req,res){   
res.render('scholarshipauditions-menu') 
});

app.get("/scholarshipauditions/contact", function(req,res){   
res.render('scholarshipauditions-contact') 
});

app.get("/scholarshipauditions/about", function(req,res){   
res.render('scholarshipauditions-about') 
});



app.get("/welchstump/home", function(req,res){   
res.render('welchstump-home') 
});



app.get("/directorsletters/home", function(req,res){   
res.render('directorsletters-home') 
});

app.get("/directorsletters/aboutus", function(req,res){   
res.render('directorsletters-about') 
});


app.get("/directorsletters/contact", function(req,res){   
res.render('directorsletters-contact') 
});


app.get('/directorsletters/termsandservices', function(req,res){
res.render('directorsletters-termsandservices')
});


app.get('/directorsletters/band-toc', function(req,res){
res.render('directorsletters-band-toc')
});

app.get('/directorsletters/chior-toc', function(req,res){
res.render('directorsletters-chior-toc')
});

app.get('/directorsletters/orchestra-toc', function(req,res){
res.render('directorsletters-orchestra-toc')
});

app.get('/directorsletters/musicaltheater-toc', function(req,res){
res.render('directorsletters-musicaltheater-toc')
});



//LETTER ROUTES

//LETTERS INCLUDING SEARCH
app.get('/directorsletters/letters', function (req, res) {
  const searchQuery = req.query.search || '';
  const page = parseInt(req.query.page) || 1;

  // Filter parameters
  const recipientFilter = req.query.recipient || '';
  const categoryFilter = req.query.category || '';

  const query = `
    SELECT l.*, w.name AS writer_name, r.name AS recipient_name, c.name AS category_name
    FROM directors_letters_db.letters l
    INNER JOIN directors_letters_db.letterwriters w ON l.writer_id = w.writer_id
    INNER JOIN directors_letters_db.letterrecipients r ON l.recipient_id = r.recipient_id
    INNER JOIN directors_letters_db.lettercategories c ON l.category_id = c.category_id
    WHERE
      (l.title ILIKE $1 OR l.content_link ILIKE $1)
      ${recipientFilter ? `AND l.recipient_id = ${recipientFilter}` : ''}
      ${categoryFilter ? `AND l.category_id = ${categoryFilter}` : ''}
    OFFSET $2
    LIMIT 24
  `;

  const searchParam = `%${searchQuery}%`;
  const offset = (page - 1) * 24;

  pool.query(query, [searchParam, offset], (err, result) => {
    if (err) {
      console.error('Error retrieving letters from the database:', err);
      return res.status(500).send('Internal Server Error');
    }

    const letters = result.rows;

    // Get the total count of letters without pagination
    pool.query('SELECT COUNT(*) AS total FROM directors_letters_db.letters', (err, countResult) => {
      if (err) {
        console.error('Error retrieving letter count from the database:', err);
        return res.status(500).send('Internal Server Error');
      }

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / 20);

      // Get letter recipients for the filter dropdown
      pool.query('SELECT * FROM directors_letters_db.letterrecipients', (recipientErr, recipientResult) => {
        if (recipientErr) {
          console.error('Error retrieving letter recipients from the database:', recipientErr);
          return res.status(500).send('Internal Server Error');
        }

        const recipients = recipientResult.rows;

        // Get letter categories for the filter dropdown (sorted alphabetically)
        pool.query('SELECT * FROM directors_letters_db.lettercategories ORDER BY name', (categoryErr, categoryResult) => {
          if (categoryErr) {
            console.error('Error retrieving letter categories from the database:', categoryErr);
            return res.status(500).send('Internal Server Error');
          }

          const categories = categoryResult.rows;

          res.render('directorsletters-letters', {
            letters,
            searchQuery,
            recipientFilter,
            categoryFilter,
            recipients,
            categories,
            page,
            totalPages
          });
        });
      });
    });
  });
});


// Render the form for adding a new letter
app.get('/directorsletters/add-letter', function (req, res) {
// Fetch the writer, recipient, and category data from the database
const writerQuery = 'SELECT * FROM directors_letters_db.letterwriters';
const recipientQuery = 'SELECT * FROM directors_letters_db.letterrecipients';
const categoryQuery = 'SELECT * FROM directors_letters_db.lettercategories';

// Use Promise.all to execute all queries simultaneously
Promise.all([
pool.query(writerQuery),
pool.query(recipientQuery),
pool.query(categoryQuery)
])
.then(([writerResult, recipientResult, categoryResult]) => {
  const letterwriters = writerResult.rows;
  const letterrecipients = recipientResult.rows;
  const lettercategories = categoryResult.rows;

  res.render('directorsletters-add-letter', {
    letterwriters,
    letterrecipients,
    lettercategories
  });
})
.catch((err) => {
  console.error('Error retrieving data from the database:', err);
  res.status(500).send('Internal Server Error');
});
});


app.post('/directorsletters/letters', function(req, res) {
const { title, content_link, download_link, writer, recipient, category } = req.body;

// Perform database query to insert the new letter
const query = 'INSERT INTO directors_letters_db.letters (title, content_link, download_link, writer_id, recipient_id, category_id) VALUES ($1, $2, $3, $4, $5, $6)';
const values = [title, content_link, download_link, writer, recipient, category];

pool.query(query, values, (err, result) => {
if (err) {
  console.error('Error inserting new letter into the database:', err);
  return;
}
console.log('New letter inserted into the database');
res.redirect('/directorsletters/letters'); // Redirect to the letters page after creating the letter
});
});


app.get('/directorsletters/letters/:id', function(req, res) {
const randomBanner = bannersArray[Math.floor(Math.random() * bannersArray.length)];
const letterId = req.params.id;
const query = `
SELECT l.*, w.name AS writer_name, r.name AS recipient_name, c.name AS category_name
FROM directors_letters_db.letters l
INNER JOIN directors_letters_db.letterwriters w ON l.writer_id = w.writer_id
INNER JOIN directors_letters_db.letterrecipients r ON l.recipient_id = r.recipient_id
INNER JOIN directors_letters_db.lettercategories c ON l.category_id = c.category_id
WHERE l.letter_id = $1`;
             ;
pool.query(query, [letterId], (err, result) => {
if (err) {
  console.error('Error retrieving letter from the database:', err);
  return res.status(500).send('Internal Server Error');
}

if (result.rows.length === 0) {
  return res.status(404).send('Letter not found');
}

const letter = result.rows[0];
res.render('directorsletters-letter-index', {banner: randomBanner, letter });
});
});


// Edit letter page
app.get('/directorsletters/letters/:id/edit', function(req, res) {
const letterId = req.params.id;
const queryLetter = 'SELECT * FROM directors_letters_db.letters WHERE letter_id = $1';
const queryWriters = 'SELECT * FROM directors_letters_db.letterwriters';
const queryRecipients = 'SELECT * FROM directors_letters_db.letterrecipients';
const queryCategories = 'SELECT * FROM directors_letters_db.lettercategories';

pool.query(queryLetter, [letterId], (err, resultLetter) => {
if (err) {
  console.error('Error retrieving letter from the database:', err);
  return res.status(500).send('Internal Server Error');
}

if (resultLetter.rows.length === 0) {
  return res.status(404).send('Letter not found');
}

const letter = resultLetter.rows[0];

// Fetch letterwriters data from the database
pool.query(queryWriters, (err, resultWriters) => {
  if (err) {
    console.error('Error retrieving letterwriters from the database:', err);
    return res.status(500).send('Internal Server Error');
  }

  const letterwriters = resultWriters.rows;

  // Fetch letterrecipients data from the database
  pool.query(queryRecipients, (err, resultRecipients) => {
    if (err) {
      console.error('Error retrieving letterrecipients from the database:', err);
      return res.status(500).send('Internal Server Error');
    }

    const letterrecipients = resultRecipients.rows;

    // Fetch lettercategories data from the database
    pool.query(queryCategories, (err, resultCategories) => {
      if (err) {
        console.error('Error retrieving lettercategories from the database:', err);
        return res.status(500).send('Internal Server Error');
      }

      const lettercategories = resultCategories.rows;

      res.render('directorsletters-edit-letter', {
        letter,
        letterwriters,
        letterrecipients,
        lettercategories
      });
    });
  });
});
});
});

// Update letter
app.post('/directorsletters/letters/:id/edit', function(req, res) {
const letterId = req.params.id;
const { title, content, writer, recipient, category } = req.body;

const updateQuery = 'UPDATE directors_letters_db.letters SET title = $1, content_link = $2, download_link = $3, writer_id = $4, recipient_id = $5, category_id = $6 WHERE letter_id = $7';
const updateValues = [title, content_link, download_link, writer, recipient, category, letterId];

pool.query(updateQuery, updateValues, (err, result) => {
if (err) {
  console.error('Error updating letter:', err);
  return res.status(500).send('Internal Server Error');
}

console.log('Letter updated successfully');
res.redirect('/directorsletters/letters/' + letterId); // Redirect to the letter's index view or any other desired page
});
});


// Delete letter
app.delete('/directorsletters/letters/:id', function(req, res) {
const letterId = req.params.id;
const query = 'DELETE FROM directors_letters_db.letters WHERE letter_id = $1';
pool.query(query, [letterId], (err) => {
if (err) {
  console.error('Error deleting letter:', err);
  return res.status(500).send('Internal Server Error');
}

res.redirect('/directorsletters/letters');
});
});

app.post('/directorsletters/letters/:id/delete', function(req, res) {
const letterId = req.params.id;
const query = 'DELETE FROM directors_letters_db.letters WHERE letter_id = $1';

pool.query(query, [letterId], (err, result) => {
if (err) {
  console.error('Error deleting letter:', err);
  return res.status(500).send('Internal Server Error');
}

res.redirect('/directorsletters/letters');
});
});












app.get('/directorsletters/band-director-letters', function (req, res) {
const searchQuery = req.query.search || '';
const recipientFilter = req.query.recipient || '';
const categoryFilter = req.query.category || '';
const page = parseInt(req.query.page) || 1;
const itemsPerPage = 24;

const query = `
SELECT l.*, w.name AS writer_name, r.name AS recipient_name, c.name AS category_name
FROM directors_letters_db.letters l
INNER JOIN directors_letters_db.letterwriters w ON l.writer_id = w.writer_id
INNER JOIN directors_letters_db.letterrecipients r ON l.recipient_id = r.recipient_id
INNER JOIN directors_letters_db.lettercategories c ON l.category_id = c.category_id
WHERE l.writer_id = 1
  AND (l.title ILIKE $1 OR l.content_link ILIKE $1)
  ${recipientFilter ? `AND l.recipient_id = ${recipientFilter}` : ''}
  ${categoryFilter ? `AND l.category_id = ${categoryFilter}` : ''}
OFFSET $2
LIMIT $3`;

const searchParam = `%${searchQuery}%`;
const offset = (page - 1) * itemsPerPage;

pool.query(query, [searchParam, offset, itemsPerPage], (err, result) => {
if (err) {
  console.error('Error retrieving letters from the database:', err);
  return res.status(500).send('Internal Server Error');
}

const letters = result.rows;

pool.query('SELECT COUNT(*) AS total FROM directors_letters_db.letters WHERE writer_id = 1', (err, countResult) => {
  if (err) {
    console.error('Error retrieving letter count from the database:', err);
    return res.status(500).send('Internal Server Error');
  }

  const totalCount = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch the categories from the database
  pool.query('SELECT * FROM directors_letters_db.lettercategories', (err, categoryResult) => {
    if (err) {
      console.error('Error retrieving categories from the database:', err);
      return res.status(500).send('Internal Server Error');
    }

    const lettercategories = categoryResult.rows;

    // Fetch letter recipients for the filter dropdown
    pool.query('SELECT * FROM directors_letters_db.letterrecipients', (err, recipientResult) => {
      if (err) {
        console.error('Error retrieving letter recipients from the database:', err);
        return res.status(500).send('Internal Server Error');
      }

      const letterrecipients = recipientResult.rows;

      res.render('directorsletters-band-letters', {
        letters,
        searchQuery,
        recipientFilter,
        categoryFilter,
        page,
        totalPages,
        lettercategories,
        letterrecipients,
      });
    });
  });
});
});
});


app.get('/directorsletters/choir-director-letters', function (req, res) {
const searchQuery = req.query.search || '';
const categoryFilter = req.query.category || '';
const recipientFilter = req.query.recipient || ''; // New recipient filter
const page = parseInt(req.query.page) || 1;
const limit = 24; // Number of letters per page

// Calculate the offset based on the page number and limit
const offset = (page - 1) * limit;

const query = `
SELECT 
    l.letter_id,
    l.title,
    l.content_link,
    l.download_link,
    lw.name AS writer_name,
    lr.name AS recipient_name,
    lc.name AS category_name
FROM
    directors_letters_db.letters l
    JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
    JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
    JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
WHERE
    lw.name = 'Choir Director'
    ${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
    ${recipientFilter ? `AND lr.recipient_id = ${recipientFilter}` : ''}
    ${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content_link ILIKE '%${searchQuery}%')` : ''}
OFFSET $1
LIMIT $2
`;

pool.query(query, [offset, limit], (err, result) => {
if (err) {
  console.error('Error retrieving letters from the database:', err);
  return res.status(500).send('Internal Server Error');
}

const letters = result.rows;

// Get the total count of letters to calculate the total pages
const countQuery = `
  SELECT COUNT(*) AS total
  FROM directors_letters_db.letters l
  JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
  JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
  JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
  WHERE
    lw.name = 'Choir Director'
    ${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
    ${recipientFilter ? `AND lr.recipient_id = ${recipientFilter}` : ''}
    ${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content_link ILIKE '%${searchQuery}%')` : ''}
`;

pool.query(countQuery, (countErr, countResult) => {
  if (countErr) {
    console.error('Error retrieving letter count from the database:', countErr);
    return res.status(500).send('Internal Server Error');
  }

  const totalCount = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalCount / limit);

  // Get all letter categories for the filter dropdown
  const categoryQuery = 'SELECT * FROM directors_letters_db.lettercategories';
  pool.query(categoryQuery, (categoryErr, categoryResult) => {
    if (categoryErr) {
      console.error('Error retrieving letter categories from the database:', categoryErr);
      return res.status(500).send('Internal Server Error');
    }

    const lettercategories = categoryResult.rows;

    // Get all letter recipients for the filter dropdown
    const recipientQuery = 'SELECT * FROM directors_letters_db.letterrecipients';
    pool.query(recipientQuery, (recipientErr, recipientResult) => {
      if (recipientErr) {
        console.error('Error retrieving letter recipients from the database:', recipientErr);
        return res.status(500).send('Internal Server Error');
      }

      const letterrecipients = recipientResult.rows;

      res.render('directorsletters-choir-letters', {
        letters,
        searchQuery,
        categoryFilter,
        recipientFilter, // Pass the recipient filter
        lettercategories,
        letterrecipients, // Pass the letterrecipients data to the template
        page,
        totalPages,
      });
    });
  });
});
});
});



app.get('/directorsletters/orchestra-director-letters', function (req, res) {
const searchQuery = req.query.search || '';
const categoryFilter = req.query.category || '';
const recipientFilter = req.query.recipient || ''; // New filter for letter recipients
const page = parseInt(req.query.page) || 1;
const itemsPerPage = 24;

const query = `
SELECT 
l.letter_id,
l.title,
l.content_link,
l.download_link,
lw.name AS writer_name,
lr.name AS recipient_name,
lc.name AS category_name
FROM
directors_letters_db.letters l
JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
WHERE
lw.name = 'Orchestra Director'
${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
${recipientFilter ? `AND lr.recipient_id = ${recipientFilter}` : ''} -- Filter by recipient
${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content ILIKE '%${searchQuery}%')` : ''}
OFFSET $1
LIMIT $2
`;


const offset = (page - 1) * itemsPerPage;

pool.query(query, [offset, itemsPerPage], (err, result) => {
if (err) {
  console.error('Error retrieving letters from the database:', err);
  return res.status(500).send('Internal Server Error');
}

const letters = result.rows;

// Get total letter count for pagination
const countQuery = `
  SELECT COUNT(*) AS total
  FROM directors_letters_db.letters l
  JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
  JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
  JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
  WHERE
    lw.name = 'Orchestra Director'
    ${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content ILIKE '%${searchQuery}%')` : ''}
    ${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
`;

pool.query(countQuery, (countErr, countResult) => {
  if (countErr) {
    console.error('Error retrieving letter count from the database:', countErr);
    return res.status(500).send('Internal Server Error');
  }

  const totalCount = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get all letter categories for the filter dropdown
  const categoryQuery = 'SELECT * FROM directors_letters_db.lettercategories';
  pool.query(categoryQuery, (categoryErr, categoryResult) => {
    if (categoryErr) {
      console.error('Error retrieving letter categories from the database:', categoryErr);
      return res.status(500).send('Internal Server Error');
    }

    const lettercategories = categoryResult.rows;

    // Get all letter recipients for the filter dropdown
    const recipientQuery = 'SELECT * FROM directors_letters_db.letterrecipients';
    pool.query(recipientQuery, (recipientErr, recipientResult) => {
      if (recipientErr) {
        console.error('Error retrieving letter recipients from the database:', recipientErr);
        return res.status(500).send('Internal Server Error');
      }

      const letterrecipients = recipientResult.rows;

      res.render('directorsletters-orchestra-letters', {
        letters,
        searchQuery,
        categoryFilter,
        recipientFilter,
        page,
        totalPages,
        lettercategories,
        letterrecipients,
      });
    });
  });
});
});
});

app.get('/directorsletters/musical-theater-director-letters', function (req, res) {
const searchQuery = req.query.search || '';
const categoryFilter = req.query.category || '';
const page = parseInt(req.query.page) || 1;
const itemsPerPage = 24;

const offset = (page - 1) * itemsPerPage;

const query = `
SELECT 
  l.letter_id,
  l.title,
  l.content_link,
  l.download_link,
  lw.name AS writer_name,
  lr.name AS recipient_name,
  lc.name AS category_name
FROM
  directors_letters_db.letters l
  JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
  JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
  JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
WHERE
  lw.name = 'Musical Theater Director'
  ${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
  ${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content_link ILIKE '%${searchQuery}%')` : ''}
OFFSET $1
LIMIT $2
`;

pool.query(query, [offset, itemsPerPage], (err, result) => {
if (err) {
  console.error('Error retrieving letters from the database:', err);
  return res.status(500).send('Internal Server Error');
}

const letters = result.rows;

const countQuery = `
  SELECT COUNT(*) AS total
  FROM directors_letters_db.letters l
  JOIN directors_letters_db.letterwriters lw ON l.writer_id = lw.writer_id
  JOIN directors_letters_db.letterrecipients lr ON l.recipient_id = lr.recipient_id
  JOIN directors_letters_db.lettercategories lc ON l.category_id = lc.category_id
  WHERE
    lw.name = 'Musical Theater Director'
    ${categoryFilter ? `AND lc.category_id = ${categoryFilter}` : ''}
    ${searchQuery ? `AND (l.title ILIKE '%${searchQuery}%' OR l.content ILIKE '%${searchQuery}%')` : ''}
`;

pool.query(countQuery, (countErr, countResult) => {
  if (countErr) {
    console.error('Error retrieving letter count from the database:', countErr);
    return res.status(500).send('Internal Server Error');
  }

  const totalCount = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get all letter categories for the filter dropdown
  const categoryQuery = 'SELECT * FROM directors_letters_db.lettercategories';
  pool.query(categoryQuery, (categoryErr, categoryResult) => {
    if (categoryErr) {
      console.error('Error retrieving letter categories from the database:', categoryErr);
      return res.status(500).send('Internal Server Error');
    }

    // Get all letter recipients for the recipient dropdown
    const recipientQuery = 'SELECT * FROM directors_letters_db.letterrecipients';
    pool.query(recipientQuery, (recipientErr, recipientResult) => {
      if (recipientErr) {
        console.error('Error retrieving letter recipients from the database:', recipientErr);
        return res.status(500).send('Internal Server Error');
      }

      const lettercategories = categoryResult.rows;
      const letterrecipients = recipientResult.rows;

      res.render('directorsletters-musicaltheater-letters', {
        letters,
        searchQuery,
        categoryFilter,
        recipientFilter: req.query.recipient || '', // Pass recipient filter value to the view
        lettercategories,
        letterrecipients, // Pass letter recipients to the view
        page,
        totalPages,
      });
    });
  });
});
});
});



const ITEMS_PER_PAGE = 25;













const DOMAIN = 'postmaster@sandboxa0edc30416d74ce2add03eecae4a4876.mailgun.org'; // Replace with your Mailgun domain
const mg = mailgun({ apiKey: 'dbeb632da9dbfbc721f7ce9416c2ff5a', domain: DOMAIN });

// Middleware to parse incoming request data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Endpoint to send emails
app.post('/send-email', (req, res) => {
  const { name, email, subject, message } = req.body;

  const data = {
    from: `${name} <${email}>`,
    to: 'directorsletters.contact@gmail.com', // Replace with your email address to receive messages
    subject: subject,
    text: message,
  };

  mg.messages().send(data, (error, body) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('Email sent:', body);
    res.json({ message: 'Email sent successfully' });
  });
});

// Endpoint to receive emails (Webhook route)
app.post('/incoming-email', (req, res) => {
  // Handle incoming emails here
  console.log('Received email:', req.body);
  res.sendStatus(200);
});




// Read the JSON file synchronously
const bannersData = fs.readFileSync('banners.json', 'utf8');
const bannersObj = JSON.parse(bannersData);
const bannersArray = bannersObj.banners;


// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve banners from the 'banners' folder
app.use('/banners', express.static(path.join(__dirname, 'public', 'banners')));












///sql connection
const db = require('./db');

db.query('SELECT * FROM directors_letters_db.lettercategories', (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    return;
  }
  console.log('Query results:', results.rows);
});



const PORT = process.env.PORT || 3100





app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});