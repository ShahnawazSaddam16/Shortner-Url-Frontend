const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const cors = require("cors");
const dbConnection = require("./src/utils/dbConnection");
const UrlControllers = require("./src/controllers/urlControllers");
const Auth = require("./src/controllers/auth");

const app = express();
dotenv.config();
const PORT = process.env.PORT;

//Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

//RateLimit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//MongoDB Connection
dbConnection();

//Routes
app.use("/api/auth", Auth, limiter);
app.use("/api", UrlControllers, limiter);

//App Listen
app.listen(PORT,(err)=>{
    if(err){
        console.error("❌❌ Server Disconnected");
    }else{
        console.log("✅✅ Server Connected");
    }
});