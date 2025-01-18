require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const Strategy = require("passport-local");
const UserModel = require("./models/User.model");
const MongoStore = require("connect-mongo");
const PORT = 5000;

// Fetch values from the environment file
const { MONGO_URL, SESSION_SECRET } = process.env;
// console.log(MONGO_URL);

const NODE_ENV = process.env.NODE_ENV || "development";

// Database connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("DB connected!"))
  .catch((err) => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL, // Use MONGO_URL from .env
      ttl: 7 * 24 * 60 * 60 * 1000, // Session expiration time in milliseconds
    }),
    cookie: {
      secure: NODE_ENV === "production", // Secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(flash());

// Setup passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Strategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Global variables middleware
app.use((req, res, next) => {
  app.locals.success = req.flash("success");
  app.locals.error = req.flash("error");
  app.locals.user = req.user;
  app.locals.productQuantity = req.user?.cart?.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);
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

// Catch-all route for 404 errors
app.get("*", (req, res) => {
  res.render("404");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.log(err);
  if (NODE_ENV === "development") {
    return res.render("error", { err: err.message });
  } else {
    return res.render("error", { err: "Something went wrong!" });
  }
});

// Server Listen
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
