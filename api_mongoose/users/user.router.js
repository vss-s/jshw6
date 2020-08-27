const { Router } = require("express");
const userRouter = Router();
const userController = require("./user.controller");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "public/avatar_temp"),
  filename: function (req, file, cb) {
    console.log("file", file);
    const ext = path.parse(file.originalname).ext;
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ dest: storage });


userRouter.post(
  "/register",
  userController.validateCreateUser,
  userController.replaceAvatar,
  userController.createUser
);
userRouter.post(
  "/login",
  userController.validateLoginUser,
  userController.loginUser
);
userRouter.post("/logout", userController.authorize, userController.logout);
userRouter.get(
  "/current",
  userController.authorize,
  userController.getCurrentUser
);
userRouter.patch(
  "/avatars",
  userController.authorize,
  upload.single("avatar"),
  userController.updateAvatar
);

userRouter.get("/verify/:verificationToken", userController.verifyEmail);


module.exports = userRouter;
