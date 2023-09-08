/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const mongoose = require("mongoose");
const url = require("../utils/config").MONGODB_URI;

mongoose.set("strictQuery", false);

console.log("connecting to", url);

mongoose
  .connect(url)
  .then((res) => {
    console.log("we are connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error.message);
  });

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 5,
    required: true,
  },
  important: Boolean,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

noteSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Note", noteSchema);
