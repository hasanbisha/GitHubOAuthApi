const express = require("express");
const axios = require("axios");
const qs = require("querystring");
const mongoose = require("mongoose");
const exphbs = require('express-handlebars');

const app = express();

mongoose.connect("mongodb://localhost/GitUsers", { useNewUrlParser: true });

//Model of User
let userSchema = mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  url: String,
  avatar_url: String,
  created_at: String
});

let User = mongoose.model("User", userSchema);
//Model of User

//Model of Repositories
let repoSchema = mongoose.Schema({
  id: Number,
  name: String,
  url: String,
  owner: String
});

// Register Handlebars view engine
app.engine('handlebars', exphbs());
// Use Handlebars view engine
app.set('view engine', 'handlebars');

let Repository = mongoose.model("Repository", repoSchema);
//Model of Repositories

//Tvendosme ktu ngaq esht sa per praktik
let client_id = "2237242856abff508eea";
let redirect_uri = "http://localhost:5000/user/signin/callback";
let client_secret = "c62a58231e26409023dd994acde0f50bfd874a31";
let access_token = "";

app.get('/', (req, res) => {
  res.render('index');
});

app.get("/login", (req, res) => {
  const GitHubUrl =
    "https://github.com/login/oauth/authorize?" +
    qs.stringify({
      client_id: client_id,
      redirect_uri: redirect_uri
    });
  res.redirect(GitHubUrl);
});

app.all("/user/signin/callback", (req, res) => {
  const code = req.query.code;

  axios
    .post("https://github.com/login/oauth/access_token", {
      client_id: client_id,
      client_secret: client_secret,
      code: code
    })
    .then(res => {
      access_token = res.data.slice(
        res.data.indexOf("n=") + 2,
        res.data.indexOf("&s")
      );
    });

  //res.redirect
  res.redirect('/user');
});

app.get('/user', (req, res) => {
  res.render('user');
});

app.get("/user/basic_credencials", (req, res) => {
  axios({
    method: "GET",
    url: "https://api.github.com/user",
    headers: {
      Authorization: `token ${access_token}`
    }
  }).then(response => {
    User.find({ name: response.data.login }, (err, res) => {
      if (res.length > 0) {
        console.log("User alredy exist");
      } else {
        //Saving on DB
        const newUser = new User({
          id: response.data.id,
          name: response.data.login,
          email: response.data.email,
          url: response.data.url,
          avatar_url: response.data.avatar_url,
          created_at: response.data.created_at
        });

        newUser.save((err, User) => {
          if (err) {
            console.log(err);
          } else {
            console.log("User added");
          }
        });
      }
    });

    //   Gona use this if project requires react
    // res.json([
    //   {     //   { id: response.data.id },
    //   { name: response.data.login },
    //   { email: response.data.email },
    //   { url: response.data.url },
    //   { created_at: response.data.created_at } }
    // ]);

    //Just for handlebars
    res.render('userDataRequested', 
    { id: response.data.id,
      name: response.data.login,
      email: response.data.email,
      url: response.data.url,
      avatar_url: response.data.avatar_url,
      created_at: response.data.created_at });
  });
});

app.get("/user/repo", (req, res) => {
  axios({
    method: "GET",
    url: `https://api.github.com/user/repos?visibility=all`,
    headers: {
      Authorization: `token ${access_token}`
    }
  }).then(response => {
    const Urls = response.data.map(repository => {
      return repository;
    });

    Urls.forEach(url => {
      console.log(
        `${url.id} : ${url.full_name} : ${url.url} : ${url.owner.login}`
      );

      Repository.find({ url: url.url }, (err, response) => {
        if (response.length > 0) {
          console.log("Repository alredy exists");
        } else {
          const newRepo = new Repository({
            id: url.id,
            name: url.full_name,
            url: url.url,
            owner: url.owner.login
          });

          newRepo.save((err, response) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Added the repository");
            }
          });
        }
      });
    });
    
    // res.json(Urls);
    res.render('repoDataRequested', { data: Urls });
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
