const User = require("../models/User");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const { buildAuthResponse } = require("../services/tokenService");

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown so login timing does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

async function signup(req, res) {
  const { name, email, password, selectedInterests } = req.valid.body;

  if (await User.exists({ email })) {
    throw new AppError(409, "User already exists", "EMAIL_TAKEN");
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    selectedInterests
  });

  res.status(201).json(buildAuthResponse(user, "User created successfully"));
}

async function login(req, res) {
  const { email, password } = req.valid.body;

  const user = await User.findOne({ email }).select("+password");
  const matches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !matches) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  res.json(buildAuthResponse(user, "Login successful"));
}

module.exports = { signup, login };
