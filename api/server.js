const express = require("express");
const { MongoClient } = require("mongodb");
const Joi = require("@hapi/joi");

const PORT = "3000";
const MONGODB_URL =
  "mongodb+srv://smdeile:qwerty123457@superclaster.n3a9d.mongodb.net/test";
const DB_NAME = "db-contacts";

let db, contactCollection;

async function main() {
  const server = express();
  const client = await MongoClient.connect(MONGODB_URL);
  db = client.db(DB_NAME);
  contactCollection = db.collection("contacts");
  server.use(express.json());
  server.post("/contacts", validationCreateUser, createUsers);
  server.listen(PORT, () => {
    console.log("Server listening on PORT", PORT);
  });
}
function validationCreateUser(req, res, next) {
  const validationRules = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    subscription: Joi.string().required(),
    password: Joi.string().required(),
    token: Joi.string().required(),
  });
  const validationResult = validationRules.validate(req.body);
  if (validationResult.error) {
    return res.status(400).send(validationResult.error.details);
  }

  //   let Schema = Joi.object().keys({
  //     firstname: Joi.string().min(5).max(50).required(),
  //     lastname: Joi.string().min(5).max(50).required(),
  //     Email: Joi.string().required(),
  //     Password: Joi.string().required(),
  //   });
  //   return Joi.validate(message, Schema);
  //   try {
  //     const value = validationRules.validateAsync(req.body);
  //   } catch (err) {
  //     return res.status(400).send(err);
  //   }
  next();
}
async function createUsers(req, res, next) {
  try {
    const newUser = await contactCollection.insert(req.body);
    return res.status(201).json(newUser.ops[0]);
  } catch (err) {
    next(err);
  }
}

main();
