const { login } = require("../controller/userController");

const { Router } = require("express");

const router = Router();

router.post("/login", login);

module.exports = router;
