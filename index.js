require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;

const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false, // use SSL
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASS,
    api_key: process.env.MAILGUN_DOMAIN,
    domain: process.env.MAILGUN_API_KEY,
  },
});

const notifyRunwayInUse = async () => {
  const currentWx = await getCurrentWxJSON();
  if (currentWx.wdir >= 70 && currentWx.wdir <= 160) {
    transporter.sendMail(
      {
        from: process.env.MAILGUN_USER,
        to: process.env.SEND_TO_EMAIL,
        subject: "Runway 11 in use",
        text: currentWx.rawOb,
      },
      (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );
  }
};

const getCurrentWxRaw = async () => {
  const res = await fetch(
    "https://aviationweather.gov/api/data/metar?ids=KBED&format=raw&taf=false&hours=0"
  );
  const wx = await res.text();
  return wx;
};

const getCurrentWxJSON = async () => {
  const res = await fetch(
    "https://aviationweather.gov/api/data/metar?ids=KBED&format=json&taf=false&hours=0"
  );
  const wx = await res.json();
  return wx[0];
};

app.get("/", async (_, res) => {
  const wx = await getCurrentWxRaw();
  res.send(wx);
});

app.listen(port, () => {
  console.log(`Weather app listening on port ${port}`);
});

cron.schedule("*/30 * * * *", async () => {
  await notifyRunwayInUse();
});
