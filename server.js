/*********************************************************************************
 * WEB322 – Assignment 06
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html*
 *
 * Name: Marcus Brown Student ID: 127900223 Date: 2023-12-10
 *
 * Published URL: https://ruby-wide-eyed-goshawk.cyclic.app/
 *
 **********************************************************************************/
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');
const legoData = require('./modules/legoSets');
const path = require('path');
const express = require('express');
const app = express();
const HTTP_PORT = 8080;
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);
app.use((req, res, next) => {
  res.locals.errorMessage = null;
  res.locals.successMessage = null;
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}
// app.get('/session-test-add', (req, res) => {
//   req.session.message = req.query.message || ''; // add a "message" property to the session
//   res.send("session created with using 'message' query parameter");
// });
// app.get('/session-test-read', (req, res) => {
//   res.send(`session message: ${req.session.message}`); // read the "message" property from the session
// });
app.get('/', (req, res) => {
  res.render('home');
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: [
          {
            dateTime: new Date().toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              timeZoneName: 'short',
            }),
            userAgent: req.body.userAgent,
          },
        ],
      };
      res.redirect('/lego/sets');
    })
    .catch((err) => {
      res.render('login', {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: 'User created' });
    })
    .catch((err) => {
      res.render('register', {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});
app.get('/about', (req, res) => {
  res.render('about');
});
app.get(
  '/lego/addSet',
  ensureLogin,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const themeData = await legoData.getAllThemes();
      res.render('addSet', { themes: themeData });
    } catch (err) {
      res.render('500', { message: 'Database error' });
    }
  }
);
app.post(
  '/lego/addSet',
  ensureLogin,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      await legoData.addSet(req.body);
      res.redirect('/lego/sets');
    } catch (err) {
      res.render('500', {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    }
  }
);
app.get(
  '/lego/editSet/:num',
  ensureLogin,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const setData = await legoData.getSetByNum(req.params.num);
      const themeData = await legoData.getAllThemes();
      res.render('editSet', { themes: themeData, set: setData });
    } catch (err) {
      res.status(404).render('404', { message: err });
    }
  }
);
app.post(
  '/lego/editSet',
  ensureLogin,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    console.log(req.body);
    try {
      await legoData.editSet(req.body.set_num, req.body);
      res.redirect('/lego/sets');
    } catch (err) {
      res.render('500', {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    }
  }
);
app.get(
  '/lego/deleteSet/:num',
  ensureLogin,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      await legoData.deleteSet(req.params.num);
      res.redirect('/lego/sets');
    } catch (err) {
      res.render('500', {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    }
  }
);
app.get('/lego/sets', async (req, res) => {
  try {
    if (req.query.theme) {
      const allSets = await legoData.getSetsByTheme(req.query.theme);
      res.render('sets', { allSets: allSets });
    } else {
      const allSets = await legoData.getAllSets();
      res.render('sets', { allSets: allSets });
    }
  } catch (err) {
    res
      .status(404)
      .render('404', { message: 'No Sets found for a matching theme' });
  }
});
app.get('/lego/sets/:id', async (req, res) => {
  try {
    const idSets = await legoData.getSetByNum(req.params.id);
    res.render('set', { set: idSets });
  } catch (err) {
    console.log(err);
    res
      .status(404)
      .render('404', { message: 'No Sets found for a specific set num' });
  }
});
app.use((req, res) => {
  res.status(404).render('404', {
    message: 'No view matched for a specific route',
  });
});
const startServer = () => {
  legoData
    .initialize()
    .then(authData.initialize)
    .then(() => {
      app.listen(HTTP_PORT, () => {
        console.log(`app listening on:  ${HTTP_PORT}`);
      });
    })
    .catch((err) => {
      console.log(`unable to start server: ${err}`);
    });
};
startServer();

// const Sequelize = require('sequelize');

// // set up sequelize to point to our postgres database
// const sequelize = new Sequelize('LegoDB', 'MarcusB71', 'ah7p4KlCQWRb', {
//   host: 'ep-royal-breeze-51150742-pooler.us-east-2.aws.neon.tech',
//   dialect: 'postgres',
//   port: 5432,
//   dialectOptions: {
//     ssl: { rejectUnauthorized: false },
//   },
// });

// // Define a "Project" model
// const Project = sequelize.define(
//   'Project',
//   {
//     project_id: {
//       type: Sequelize.INTEGER,
//       primaryKey: true, // use "project_id" as a primary key
//       autoIncrement: true, // automatically increment the value
//     },
//     title: Sequelize.STRING,
//     description: Sequelize.TEXT,
//   },
//   {
//     createdAt: false, // disable createdAt
//     updatedAt: false, // disable updatedAt
//   }
// );
// Define our "User" and "Task" models

// const User = sequelize.define('User', {
//   fullName: Sequelize.STRING, // the user's full name (ie: "Jason Bourne")
//   title: Sequelize.STRING, // the user's title within the project (ie, developer)
// });

// const Task = sequelize.define('Task', {
//   title: Sequelize.STRING, // title of the task
//   description: Sequelize.TEXT, // main text for the task
// });

// // Associate Tasks with user & automatically create a foreign key
// // relationship on "Task" via an automatically generated "UserId" field

// User.hasMany(Task);
// // synchronize the Database with our models and automatically add the
// // table if it does not exist

// sequelize.sync().then(() => {
//   // Create user "Jason Bourne"
//   User.create({
//     fullName: 'Jason Bourne',
//     title: 'developer',
//   }).then((user) => {
//     console.log('user created');

//     // Create "Task 1" for the new user
//     Task.create({
//       title: 'Task 1',
//       description: 'Task 1 description',
//       UserId: user.id, // set the correct Userid foreign key
//     }).then(() => {
//       console.log('Task 1 created');
//     });

//     // Create "Task 2" for the new user
//     Task.create({
//       title: 'Task 2',
//       description: 'Task 2 description',
//       UserId: user.id, // set the correct Userid foreign key
//     }).then(() => {
//       console.log('Task 2 created');
//     });
//   });
// });