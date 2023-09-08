const notesRouter = require("express").Router();
const Note = require("../models/note");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

notesRouter.get("/", async (request, response) => {
  const notes = await Note.find({}).populate("user", {
    username: 1,
    name: 1,
  });
  response.json(notes);
});

notesRouter.get("/:id", async (request, response) => {
  const returnedNote = await Note.findById(request.params.id);
  if (returnedNote) {
    response.json(returnedNote);
  } else {
    response.status(404).end();
  }
});

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

notesRouter.delete("/:id", async (request, response) => {
  // eslint-disable-next-line no-undef
  jwt.verify(getTokenFrom(request), process.env.SECRET);

  await Note.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

notesRouter.post("/", async (request, response) => {
  const body = request.body;
  if (!body.content) {
    return response.status(400).json({
      error: "content missing",
    });
  }
  // eslint-disable-next-line no-undef
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }
  const user = await User.findById(decodedToken.id);

  const note = new Note({
    content: body.content,
    important: body.important || false,
    user: user.id,
  });

  const savedNote = await note.save();
  user.notes = user.notes.concat(savedNote._id);
  await user.save();
  response.json(savedNote);
});

notesRouter.put("/:id", (request, response, next) => {
  const { content, important } = request.body;
  // eslint-disable-next-line no-undef
  jwt.verify(getTokenFrom(request), process.env.SECRET);

  Note.findByIdAndUpdate(
    request.params.id,
    { content, important },
    { new: true, runValidators: true, context: "query" }
  )
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = notesRouter;
