const mongoose = require("mongoose");
const initData = require("./data.js");

const Listing = require("../models/listing.js");

const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";

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

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
<<<<<<< HEAD
    owner: "667a49df09e2dcf662c4e25a",
=======
    owner: "6678287aa68c5d93ad23781d",
>>>>>>> origin/main
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialised");
};
initDB();
