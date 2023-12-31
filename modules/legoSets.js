const Sequelize = require('sequelize');
const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

require('dotenv').config();



// Create Sequelize instance for database connection
const sequelize = new Sequelize(
 process.env.DB_DATABASE,
 process.env.DB_USER,
 process.env.DB_PASSWORD,
 {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
 }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });



// Define the Theme model
const Theme = sequelize.define(
 "Theme",
 {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
    },
 },
 {
    timestamps: false, // Disable createdAt and updatedAt fields
 }
);

// Define the Set model
const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    year: {
      type: Sequelize.INTEGER,
    },
    num_parts: {
      type: Sequelize.INTEGER,
    },
    theme_id: {
      type: Sequelize.INTEGER,
    },
    img_url: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: false, // Disable createdAt and updatedAt fields
  }
);

Set.belongsTo(Theme, { foreignKey: "theme_id" });

function initialize() {
  return sequelize
    .sync()
    .then(() => {
      // Insert initial data here if needed
      console.log("Database synchronized.");
    })
    .catch((err) => {
      console.error("Error synchronizing database:", err);
      throw err;
    });
}

function getAllSets() {
  return Set.findAll({ include: [Theme] });
}

function getSetByNum(setNum) {
  return Set.findOne({ where: { set_num: setNum }, include: [Theme] });
}

function getSetsByTheme(theme) {
  return Set.findAll({
    include: [Theme],
    where: {
      "$Theme.name$": {
        [Sequelize.Op.iLike]: `%${theme}%`,
      },
    },
  }).then((foundSets) => {
    if (foundSets.length > 0) {
      return foundSets;
    } else {
      throw new Error("Unable to find requested sets");
    }
  });
}


// Function to add a new set
const addSet = async (setData) => {
  try {
    // Create a new set using the Set model
    await Set.create(setData);
    // Resolve the Promise with no data upon successful creation
    return Promise.resolve();
  } catch (err) {
    // Reject the Promise with a human-readable error message
    return Promise.reject(err.errors[0].message);
  }
};

// Function to get all themes
const getAllThemes = async () => {
  try {
    // Use the Theme model to fetch all themes in the database
    const themes = await Theme.findAll();
    // Resolve the Promise with the themes
    return Promise.resolve(themes);
  } catch (err) {
    // Reject the Promise with the error message
    return Promise.reject(err.message);
  }
};
function editSet (setNum, setData){
  return new Promise((resolve, reject) => {
    Set.update(setData, { where: { set_num: setNum } })
      .then((result) => {
        if (result[0] === 1) {
          resolve();
        } else {
          reject(new Error('Unable to update the set. Set not found.'));
        }
      })
      .catch((err) => {
        reject(new Error(err.errors[0].message));
      });
  });
}

function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: set_num
      }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}


// Export the initialize function and additional database functions
module.exports = {
 initialize,
 getAllSets,
 getSetByNum,
 getSetsByTheme,
 addSet,
  getAllThemes,
  editSet,
  deleteSet,
};