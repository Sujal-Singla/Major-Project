const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");

const listingrouter = require("./routes/listing.js");
const reviewrouter = require("./routes/review.js");
const userrouter = require("./routes/user.js");

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(mongo_url);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: Date.now() + 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.get("/", (req, res) => {
  res.send("hi i'm root");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  // res.locals.redirectedPage = req.session.redirectUrl;
  next();
});

app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: " student@gmail.com",
    username: "delta-student",
  });
  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});

app.use("/listings", listingrouter);
app.use("/listings/:id/reviews", reviewrouter);
app.use("/", userrouter);

// Reviews post route

// app.get("/testListing", async (req, res)=>{
//     let sampleListing = nefw Listing({
//         title : "My New Villa ",
//         description: " By the beach",
//         price: 1200,
//         location : " Calangute, Goa",
//         country: " India"
//     })
//     await sampleListing.save();
//     console.log(" sample was saved");
//     res.send("successful testing");
// })

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not found!"));
});

app.use((err, req, res, next) => {
  let { status = 500, message = "Some Error Occured" } = err;
  res.render("error.ejs", { message });
  // res.status(status).send(message)
  // console.log(err)
});

app.listen(8080, () => {
  console.log(" Server is listening to port 8080");
});
