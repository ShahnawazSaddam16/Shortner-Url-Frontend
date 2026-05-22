const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnection = require("./src/utils/dbConnection");
const UrlControllers = require("./src/controllers/urlControllers");
const Auth = require("./src/controllers/auth");
const Plans = require("./src/controllers/plans");

const app = express();
dotenv.config();
const PORT = process.env.PORT;

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:3000",
      "https://url-shortener.buttnetworks.com"
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
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
app.use("/api/auth", limiter, Auth);
app.use("/api", limiter, UrlControllers);
app.use("/api", limiter, Plans);

//App Listen
app.listen(PORT,(err)=>{
    if(err){
        console.error("❌❌ Server Disconnected");
    }else{
        console.log("✅✅ Server Connected");
    }
});