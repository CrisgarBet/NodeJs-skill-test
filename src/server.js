const express = require("express");
const app = express();

const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session"); 
const fs = require("fs");
const { url } = require("./config/database.js");

mongoose.connect(url, {
  useMongoClient: true
});

require("./config/passport")(passport);

// settings
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middlewares
app.use(
  morgan(":date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms", {
    stream: fs.createWriteStream(
      path.join(__dirname, "public", "assets", "log.txt"),
      { flags: "a" }
    )
  })
);
app.use(morgan(":date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
// required for passport
app.use(
  session({
    secret: "pruebajaya",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes
require("./app/routes.js")(app, passport);

// static files
app.use(express.static(path.join(__dirname, "public")));

// start the server
app.listen(app.get("port"), () => {
  console.log("server on port ", app.get("port"));
});
