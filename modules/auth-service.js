const mongoose = require('mongoose');
require('dotenv').config();
let Schema = mongoose.Schema;
//const bcrypt = require('bcryptjs');

userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date }, { userAgent: String }],
});
let user;

const initialize = () => {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);
    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      user = db.model('users', userSchema);
      console.log('Mongo connected');
      resolve();
    });
  });
};
const registerUser = (userData) => {
  return new Promise((res, rej) => {
    if (userData.password !== userData.password2) {
      rej('Passwords do not match');
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;
          let newUser = new user(userData);
          newUser
            .save()
            .then(() => {
              res();
            })
            .catch((err) => {
              if (err.code != 11000) {
                rej('There was an error creating the user: ', err);
              } else {
                rej('Username already taken!');
              }
            });
        })
        .catch((err) => {
          console.log(err);
          rej('There was an error encrypting the password', err);
        });
    }
  });
};
const checkUser = (userData) => {
  return new Promise((res, rej) => {
    user
      .find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length == 0) {
          rej('Unable to find user: ', userData.userName);
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (result) {
                if (
                  users[0].loginHistory &&
                  users[0].loginHistory.length >= 8
                ) {
                  users[0].loginHistory.pop();
                }
                users[0].loginHistory.unshift({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent.toString(),
                });
                user
                  .updateOne(
                    { username: users[0].userName },
                    { $set: { loginHistory: users[0].loginHistory } }
                  )
                  .exec()
                  .then(() => {
                    res(users[0]);
                  })
                  .catch((err) => {
                    rej('There was an error verifying the user: ', err);
                  });
              } else {
                rej('Incorrect password for user :' + userData.userName);
              }
            })
            .catch(() => {
              rej('Unable to find user: ', userData.username);
            });
        }
      });
  });
};
module.exports = {
  initialize,
  registerUser,
  checkUser,
};