const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

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

app.get("/", (req, res) => {
  res.send("hi i'm root");
});

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    // Validate and convert the id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    try {
      const listing = await Listing.findById(objectId).populate("reviews");
      if (!listing) {
        return res.status(404).send({ error: "Listing not found" });
      }
      res.render("listings/show.ejs", { listing });
    } catch (error) {
      res.status(500).send({ error: "Internal Server Error" });
    }
  })
);

app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    // console.log(listing);
    res.redirect("/listings");
  })
);

app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/edit.ejs", { listing });
  })
);

app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id);
    console.log(deleted);
    res.redirect("/listings");
  })
);

// Reviews post route
app.post("/listings/:id/reviews", async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.reviews.push(newReview);
  await listing.save();
  await newReview.save();
  res.redirect(`/listings/${listing._id}`);
  console.log("new review saved");
  console.log(newReview);
  // res.redirect(`/listings/${listing._id}`);
});

app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { review: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
  })
);

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
