const express = require("express");
const cookieparser = require("cookie-parser");
const authRouter = require("./routes/auth.routes")

const app = express()

app.use(express.json());
app.use(cookieparser());


// using all the router here
app.use("/api/auth",authRouter);


module.exports = app;
