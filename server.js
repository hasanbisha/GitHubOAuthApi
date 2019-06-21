const express = require("express");
const axios = require("axios");
const qs = require("querystring");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");

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

let Repository = mongoose.model("Repository", repoSchema);
//Model of Repositories

// Midleware
// Register Handlebars view engine
app.engine("handlebars", exphbs());
// Use Handlebars view engine
app.set("view engine", "handlebars");
// Express sessions midleware
app.use(session({ secret: "ssshhhhh" }));
// Midleware

//Tvendosme ktu ngaq esht sa per praktik
let client_id = "2237242856abff508eea";
let redirect_uri = "http://localhost:5000/user/signin/callback";
let client_secret = "c62a58231e26409023dd994acde0f50bfd874a31";

app.get("/", (req, res) => {
  res.render("index", { logout: "Yep" });
});

app.get("/login", (req, res) => {
  if (req.session.username) {
    res.redirect("/user");
  } else {
    const GitHubUrl =
      "https://github.com/login/oauth/authorize?" +
      qs.stringify({
        client_id: client_id,
        redirect_uri: redirect_uri
      });
    res.redirect(GitHubUrl);
  }
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
      req.session.access_token = res.data.slice(
        res.data.indexOf("n=") + 2,
        res.data.indexOf("&s")
      );
    });

  setTimeout(() => {
    //res.redirect
    res.redirect("/user");
  }, 1000);
});

// KY ESHT LEMSH
// Kontrollon nese useri ka access token -> nqs e ka kontrollon nqs ka username -> po pat i faqa vazhdon sic duhet -> po spat e merr -> po spat as access token i ben redirect per ne '/'
// Tek ky rast specifik kontrollon nqs sapo i ka ber login ne menyr q t evitoj marrjen e username cdo her q vizitohet kjo url
app.get("/user", (req, res) => {
  if (req.session.access_token) {
    if (req.session.username) {
      // Ktu kemi kur cdo gj esht OKE
      res.render("user", { username: req.session.username });
    } else {
      axios({
        method: "GET",
        url: "https://api.github.com/user",
        headers: {
          Authorization: `token ${req.session.access_token}`
        }
      }).then(response => {
        setTimeout(() => {
          req.session.username = response.data.login;
          res.render("user", { username: req.session.username });
        }, 1000);
      });
    }
  } else {
    res.redirect("/");
  }
});

app.get("/user/basic_credencials", (req, res) => {
  if (req.session.username) {
    // Ktu kemi kur cdo gj esht OKE
    axios({
      method: "GET",
      url: "https://api.github.com/user",
      headers: {
        Authorization: `token ${req.session.access_token}`
      }
    }).then(response => {
      User.find({ name: response.data.login }, (err, UserNumber) => {
        //Saving on DB
        const newUser = new User({
          id: response.data.id,
          name: response.data.login,
          email: response.data.email,
          url: response.data.url,
          avatar_url: response.data.avatar_url,
          created_at: response.data.created_at
        });
        if (UserNumber.length > 0) {
          // console.log("User alredy exist");
        } else {
          newUser.save((err, User) => {
            if (err) {
              console.log(err);
            } else {
              // console.log("User added");
            }
          });
        }
        //Just for handlebars
        res.render("userDataRequested", {
          User: newUser,
          username: req.session.username
        });
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/user/repo", (req, res) => {
  if (req.session.username) {
    // Ktu kemi kur cdo gj esht OKE
    axios({
      method: "GET",
      url: `https://api.github.com/user/repos?visibility=all`,
      headers: {
        Authorization: `token ${req.session.access_token}`
      }
    }).then(response => {
      const Urls = response.data.map(repository => {
        return repository;
      });

      Urls.forEach(url => {
        Repository.find({ url: url.url }, (err, response) => {
          if (response.length > 0) {
            //console.log("Repository alredy exists");
          } else {
            const newRepo = new Repository({
              id: url.id,
              name: url.full_name,
              url: url.url,
              owner: url.owner.login
            });

            newRepo.save((err, response) => {
              console.log(err);
            });
          }
        });
      });

      // res.json(Urls);
      res.render("repoDataRequested", {
        data: Urls,
        username: req.session.username
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
