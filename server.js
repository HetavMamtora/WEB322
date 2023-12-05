const express = require('express');
const app = express();
const legoData = require("./modules/legoSets");
const HTTP_PORT = process.env.PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Initialize data and start the server
legoData.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on port ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log("Unable to start server:", err);
  });

// Home route
app.get('/', (req, res) => {
  res.render("home");
});

// About route
app.get('/about', (req, res) => {
  res.render("about");
});

// Lego sets route
app.get("/lego/sets", async (req, res) => {
  try {
    if (req.query.theme) {
      let sets = await legoData.getSetsByTheme(req.query.theme);
      if (sets.length === 0) {
        res.status(404).render("404", { message: "No sets found for the specified theme" });
      } else {
        res.render("sets", { sets, theme: req.query.theme });
      }
    } else {
      let sets = await legoData.getAllSets();
      if (sets.length === 0) {
        res.status(404).render("404", { message: "No sets found" });
      } else {
        res.render("sets", { sets, theme: "All Sets" });
      }
    }
  } catch (err) {
    // Handle errors consistently
    console.error("Error handling Lego sets route:", err);
    res.status(500).render("500", {
      message: "Internal Server Error",
    });
  }
});

// Individual Lego set route
app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    if (!set) {
      res.status(404).render("404", { message: "No set found for the specified set number" });
    } else {
      res.render("set", { set });
    }
  } catch (err) {
    // Handle errors consistently
    console.error("Error handling individual Lego set route:", err);
    res.status(500).render("500", {
      message: "Internal Server Error",
    });
  }
});


// New route to render the "Add Set" page
app.get('/lego/addSet', async (req, res) => {
  try {
    // Fetch themes and render the "addSet" view
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes });
  } catch (err) {
    // If an error occurs, render the "500" view
    res.render("500", { message: `Error fetching themes: ${err.message}` });
  }
});

// New route to handle form submission and add a new set
app.get('/lego/addSet', async (req, res) => {
  try {
    // Assuming you have an asynchronous function to get themes
    const themes = await legoData.getAllThemes();

    // Render the addSet view with the themes
    res.render('addSet', { themes });
  } catch (error) {
    // Handle errors, for example, render a 500 page with an error message
    res.status(500).render('500', { message: `Error: ${error.message}` });
  }
});
