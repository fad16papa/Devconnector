const exporess = require("express");
const router = exporess.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

//@route GET api/auth
//@desc validate the jwt of the user
//@access Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

//@route Post api/auth
//@desc Authenticate the user and get the token
//@access Public
router.post(
  "/",
  [
    check("email", "Please provide valid email").isEmail(),
    check("password", "Passwor is required").exists(),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if the their is an error return 400 bad request
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      //Check if the user exist
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      //check if the user password matches
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      //create payload for jwt
      const payload = {
        user: {
          id: user.id,
        },
      };
      //merging payload and jwtsecret key for creating jwt
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (error, token) => {
          if (error) {
            throw error;
          } else {
            // Return jwt
            res.json({ token });
          }
        }
      );
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
