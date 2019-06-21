const mongoose = require("mongoose");


let userSchema = mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  url: String,
  avatar_url: String,
  created_at: String
});

let User = module.exports = mongoose.model("User", userSchema);