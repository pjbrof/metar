require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const redsox = require("./redsox/redsox");
const flights = require("./aviation/flights");
const weather = require("./aviation/weather");

const app = express();
const port = 3000;

app
  .set("view engine", "ejs")
  .use("/metar", weather.router)
  .use("/flights", flights.router)
  .use("/sox", redsox.router)
  .listen(port, () => console.log(`Metar app listening on port ${port}`));

app.get("/", (_, res) => {
  res.render("home.ejs");
});

cron.schedule("*/30 * * * *", async () => {
  await weather.notifyRunwayInUseNtfy();
});

cron.schedule("0 10 * * *", async () => {
  await redsox.notifyGameDayNtfy();
  await flights.getFlights();
});
