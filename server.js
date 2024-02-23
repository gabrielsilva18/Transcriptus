const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const express = require("express");
const app = express();

const routerSave = require("./routes/wordDetails.routes");
const routerTranslator = require("./routes/translator.routes");
const routerApp = require("./routes/app.routes");
const routeContext = require("./routes/context.routes");

const port = process.env.PORT || 3000;

// Configure session and flash middleware
app.use(
  session({
    secret: ["T8c11KXKhf6NIsQ", "0sZ9sesp6LMG8le", "84F8IQbW24nuxvv"],
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// define view engine to ejs and bodyParser
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// define path of static files and routes
app.use(express.static("public"));
app.use("/", routerApp);
app.use(routerSave, routerTranslator, routeContext);

app.listen(port, (err) => {
  if (err) console.log(err);
  console.log("Server listening on PORT", port);
});
