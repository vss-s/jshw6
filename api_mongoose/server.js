const express = require("express");
const mongoose = require("mongoose");
const contactRouter = require("./users/contact.router");
const userRouter = require("./users/user.router.js");
const path = require("path");

require("dotenv").config();

module.exports = class UserServer {
  constructor() {
    this.server = null;
  }

  async start() {
    this.initServer();
    this.initMiddleware();
    this.initRoutes();
    await this.initDatabase();
    this.startListening();
  }
  initServer() {
    this.server = express();
    this.server.use(express.json({ limit: "25kb" }));
    this.server.use(express.urlencoded({ extended: false }));
  }
  initMiddleware() {
    this.server.use(express.json());
  }
  initRoutes() {
    this.server.use("/contacts", contactRouter);
    this.server.use("/auth", userRouter);
    this.server.use(express.static(path.join(__dirname, "public")));
    this.server.use("/users", userRouter);
  }

  async initDatabase() {
    mongoose.set("useUnifiedTopology", true);

    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
    });
    mongoose.set("useFindAndModify", false);
  }

  async startListening() {
    try {
      const PORT = process.env.PORT;
      const connection = await this.server.listen(PORT, () => {
        console.log("Database connection successful", PORT);
      });
    } catch (err) {
      console.log("err", err);
      process.exit(1);
    }
  }
};
