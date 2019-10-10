const fs = require("fs");
const path = require("path");

module.exports = (app, passport) => {
  app.get("/", (req, res) => {
    res.render("index");
  });

  // Login

  app.get("/login", (req, res) => {
    res.render("login", { message: req.flash("loginMessage") });
  });

  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile",
      failureRedirect: "/login",
      failureFlash: true 
    })
  );

  // register
  app.get("/signup", (req, res) => {
    res.render("signup", { message: req.flash("signupMessage") });
  });

  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile",
      failureRedirect: "/signup",
      failureFlash: true 
    })
  );

  app.get("/profile", (req, res) => {
    res.render("profile", { user: req.user });
  });

  // arrays

  function sortedArray(type, req, res) {
    const pathFile = path.join("src", "public", "assets", "original.txt");
    fs.readFile(pathFile, function(err, data) {
      const response = [];
      data
        .toString("utf-8")
        .split(";")
        .forEach((element, index) => {
          const arrayUpdate = element
            .trim()
            .replace("[", "")
            .replace("]", "")
            .split(",");

          switch (type) {
            case "asc":
              arrayUpdate.sort((a, b) => a - b);
              break;

            case "des":
              arrayUpdate.sort((a, b) => b - a);
              break;

            case "mix":
              if (index % 2 == 0) {
                arrayUpdate.sort((a, b) => a - b);
              } else {
                arrayUpdate.sort((a, b) => b - a);
              }
              break;
          }

          response.push(arrayUpdate);
        });

      const pathWrite = path.join("src", "public", "assets", "sorted.txt");
      fs.writeFile(
        pathWrite,
        response
          .map(function(v) {
            return v.join(", ");
          })
          .join("\n"),
        function(err) {
          if (err) {
            return console.log(err);
          }
          return res.json(response);
        }
      );
      if (err) {
        console.error(err);
      }
    });
  }

  app.get("/asc", (req, res) => {
    sortedArray("asc", req, res);
  });

  app.get("/des", (req, res) => {
    sortedArray("des", req, res);
  });

  app.get("/mix", (req, res) => {
    sortedArray("mix", req, res);
  });
};
