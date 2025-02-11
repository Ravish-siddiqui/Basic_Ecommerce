require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const Strategy = require("passport-local");
const MongoStore = require("connect-mongo");
const UserModel = require("./models/User.model");

const app = express();
const PORT = 5000;

// Fetch values from .env
const { MONGO_URL, SESSION_SECRET } = process.env;
const NODE_ENV = process.env.NODE_ENV || "development";

// Database Connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ DB connected!"))
  .catch((err) => console.log("❌ DB connection error:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Session Configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      ttl: 7 * 24 * 60 * 60, // 7 days
    }),
    cookie: {
      secure: NODE_ENV === "production", // Secure cookies only in production (HTTPS)
      httpOnly: true,
      sameSite: "None", // Required for cross-origin sessions
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(flash());

// Setup Passport Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Strategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Debugging Sessions
app.use((req, res, next) => {
  console.log("Session Data:", req.session);
  console.log("Logged in User:", req.user);
  next();
});

// Global Variables Middleware
app.use((req, res, next) => {
  app.locals.success = req.flash("success");
  app.locals.error = req.flash("error");
  app.locals.user = req.user;
  app.locals.productQuantity = req.user?.cart?.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  next();
});

// Set Public Folder
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as Template Engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("home", { title: "Home | E-Commerce" });
});

// Import Routes
const productRoutes = require("./routes/product.routes");
const reviewRoutes = require("./routes/review.routes");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const wishListAPI = require("./routes/api/wishlist.routes");
const paymentAPI = require("./routes/api/payment.routes");

// Use Routes
app.use(productRoutes);
app.use(reviewRoutes);
app.use(authRoutes);
app.use(cartRoutes);
app.use(wishListAPI);
app.use(paymentAPI);

// Catch-all Route for 404 Errors
app.get("*", (req, res) => {
  res.render("404");
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  if (NODE_ENV === "development") {
    return res.render("error", { err: err.message });
  } else {
    return res.render("error", { err: "Something went wrong!" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
