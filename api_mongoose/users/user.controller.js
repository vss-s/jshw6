const Joi = require("@hapi/joi");
const Avatar = require("avatar-builder");
const path = require("path");
const fs = require("fs").promises;

const uuid = require("uuid");
const sgMail = require("@sendgrid/mail");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const userModel = require("./user.model");

const {
  Types: { ObjectId },
} = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../helpers/errors.constructor");
class UserController {
  constructor() {
    this._costFactor = 4;
  }

  get createUser() {
    return this._createUser.bind(this);
  }
  get loginUser() {
    return this._loginUser.bind(this);
  }
  get getCurrentUser() {
    return this._getCurrentUser.bind(this);
  }

  async _getCurrentUser(req, res, next) {
    const [userForResponse] = this.prepareUserResponse([req.user]);
    console.log(userForResponse);
    return res.status(200).json(userForResponse);
  }

  async _createUser(req, res, next) {
    try {
      const { email, password, subscription, token } = req.body;
      const userEmail = await userModel.findUserByEmail(email);
      if (userEmail) {
        return res.status(409).send({ message: "Email in use" });
      }
      const passwordHash = await bcryptjs.hash(password, this._costFactor);
      const user = await userModel.create({
        email,
        password: passwordHash,
        subscription,
        token,
      });
      await this.sendVerificationEmail(user);
      return res.status(201).json({
        user: {
          email: user.email,
          subscription: user.subscription,
          avatar: `http://localhost:3000/images/${user.email}.png`,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async _loginUser(req, res, next) {
    try {

      const { email, password, subscription } = req.body;
      const token = await this.checkUser(email, password);

      return res.status(200).json({
        token: token,
        user: {
          email: email,
          subscription: subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }
  async checkUser(email, password) {
    const user = await userModel.findUserByEmail(email);
    if (!user || user.status !== "Verified") {
      throw new UnauthorizedError("Email or password is wrong");
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Email or password is wrong");
    }
    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: 2 * 24 * 60 * 60,
    });
    await userModel.updateToken(user._id, token);
    return token;
  }
  async logout(req, res, next) {
    try {
      const user = req.user;
      await userModel.updateToken(user._id, null);

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async authorize(req, res, next) {
    try {
      console.log("Content-Type", req.get("Content-Type"));
      // 1. витягнути токен користувача з заголовка Authorization
      const authorizationHeader = req.get("Authorization");
      const token = authorizationHeader.replace("Bearer ", "");
      // 2. витягнути id користувача з пейлоада або вернути користувачу
      // помилку зі статус кодом 401
      let userId;
      try {
        userId = await jwt.verify(token, process.env.JWT_SECRET).id;
      } catch (err) {
        next(new UnauthorizedError("User not authorized"));
      }

      // 3. витягнути відповідного користувача. Якщо такого немає - викинути
      // помилку зі статус кодом 401
      // userModel - модель користувача в нашій системі
      const user = await userModel.findById(userId);
      if (!user || user.token !== token) {
        throw new UnauthorizedError("User not authorized");
      }

      // 4. Якщо все пройшло успішно - передати запис користувача і токен в req
      // і передати обробку запиту на наступний middleware
      req.user = user;
      req.token = token;

      next();
    } catch (err) {
      next(err);
    }
  }

  async updateAvatar(req, res, next) {
    try {
      const user = req.user;

      const userAvatar = await userModel.findUserByEmail(user.email);
      const { email } = userAvatar;
      const destinationFolder = path.join(
        __dirname,
        "..",
        "public/images",
        email + ".png"
      );

      try {
        await fs.unlink(userAvatar.avatarURL);
      } catch (error) {
        console.log(error.message);
      }

      const updatedUser = await userModel.findUserByIdAndUpdate(user._id, {

        avatarURL: destinationFolder,

      });

      if (!updatedUser) {
        return res.status(404).json("Not Found contact");
      }


      return res.status(200).json({ avatarURL: updatedUser });

    } catch (err) {
      next(err);
    }
  }

  async replaceAvatar(req, res, next) {
    const { email } = req.body;
    const generalAvatar = Avatar.builder(
      Avatar.Image.margin(Avatar.Image.circleMask(Avatar.Image.identicon())),
      128,
      128
    );

    const pathAvatar = path.join(
      __dirname,
      "..",
      "public/temp",
      email + ".png"
    );

    const avatar = await generalAvatar.create(email);
    await fs.writeFile(pathAvatar, avatar);

    const destinationFolder = path.join(
      __dirname,

      "..",
      "public/images",
      email + ".png"
    );

    fs.copyFile(pathAvatar, destinationFolder, (err) => {
      if (err) console.log("err", err);
    });
    await fs.unlink(pathAvatar);

    next();
  }


  async verifyEmail(req, res, next) {
    try {
      const { verificationToken } = req.params;
      console.log("token", verificationToken);
      const userToVerify = await userModel.findByVerificationToken(
        verificationToken
      );
      if (!userToVerify) {
        res.status(402).send("cancel");
      }
      userModel.verifyUser(userToVerify._id);
      return res.status(200).send("OK");
    } catch (err) {
      next(err);
    }
  }

  validateCreateUser(req, res, next) {
    const registrationRules = Joi.object({
      email: Joi.string().required(),
      subscription: Joi.string().required(),
      password: Joi.string().required(),
    });
    const validationResult = registrationRules.validate(req.body);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error.details);
    }
    next();
  }
  validateLoginUser(req, res, next) {
    const loginRules = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    const validationResult = loginRules.validate(req.body);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error.details);
    }
    next();
  }
  prepareUserResponse(users) {
    return users.map((user) => {
      const { email, subscription } = user;
      return { email, subscription };
    });
  }
  async sendVerificationEmail(user) {
    const verificationToken = uuid.v4();

    await userModel.createVerificationToken(user._id, verificationToken);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: user.email,
      from: "smdeile@gmail.com",
      subject: "Sending verification token",
      text: "and easy to do anywhere, even with Node.js",
      html: `<a href='http://localhost:3000/auth/verify/${verificationToken}'>Click this link</a>`,
    };
    const send = await sgMail.send(msg);
    console.log("send", send);
  }
}
module.exports = new UserController();
