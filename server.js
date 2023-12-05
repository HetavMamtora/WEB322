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
