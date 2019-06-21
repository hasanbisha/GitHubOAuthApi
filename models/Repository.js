const mongoose = require("mongoose");

let repoSchema = mongoose.Schema({
  id: Number,
  name: String,
  url: String,
  owner: String
});

let Repository = module.exports = mongoose.model("Repository", repoSchema);