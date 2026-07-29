"use strict";

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    local: {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254
      },
      password: {
        type: String,
        required: true,
        select: false
      }
    }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.local.password = await bcrypt.hash(password, 12);
};

userSchema.methods.validatePassword = function validatePassword(password) {
  return bcrypt.compare(password, this.local.password);
};

module.exports = mongoose.model("User", userSchema);
