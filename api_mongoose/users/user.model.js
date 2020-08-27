const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarURL: { type: String, required: false },
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
    required: true,
  },
  status: {
    type: String,
    enum: ["verified", "created"],
    required: true,
    default: "created",
  },
  verificationToken: { type: String, required: false },
  token: { type: String, required: false },
});
userSchema.statics.findUserByEmail = findUserByEmail;
userSchema.statics.findUserByIdAndUpdate = findUserByIdAndUpdate;
userSchema.statics.updateToken = updateToken;

userSchema.statics.createVerificationToken = createVerificationToken;
userSchema.statics.findByVerificationToken = findByVerificationToken;
userSchema.statics.verifyUser = verifyUser;


async function findUserByEmail(email) {
  return this.findOne({ email });
}

async function findUserByIdAndUpdate(contactId, updateParameter) {
  return this.findByIdAndUpdate(
    contactId,
    {
      $set: updateParameter,
    },
    {
      new: true,
    }
  );
}
async function updateToken(id, newToken) {
  return this.findByIdAndUpdate(id, { token: newToken });
}
async function createVerificationToken(userId, verificationToken) {
  console.log("find");
  return this.findByIdAndUpdate(
    userId,
    {
      verificationToken,
    },
    {
      new: true,
    }
  );
}
async function findByVerificationToken(verificationToken) {
  return this.findOne({ verificationToken });
}
async function verifyUser(userId) {
  return this.findUserByIdAndUpdate(
    userId,
    { status: "Verified", verificationToken: null },
    { new: true }
  );
}
const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
