const express = require("express");
const router = express.Router();

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

const notifyRunwayInUseNtfy = async () => {
  const currentWx = await getCurrentWxJSON();
  if (currentWx.wdir >= 70 && currentWx.wdir <= 160 && !onceFlag) {
    try {
      fetch(`http://${process.env.HOST_IP}/activerunway`, {
        method: "POST",
        body: `Runway 11 in use 🛫 \n${currentWx.rawOb}`,
      });
      onceFlag = true;
    } catch (error) {
      console.log("Notification error: ", error);
    }
  } else if (currentWx.wdir <= 70 && currentWx.wdir >= 160 && onceFlag) {
    try {
      fetch(`http://${process.env.HOST_IP}/activerunway`, {
        method: "POST",
        body: `Runway 11 no longer in use 🛬 \n${currentWx.rawOb}`,
      });
      onceFlag = false;
    } catch (error) {
      console.log("Notification error: ", error);
    }
  }
};

router.get("/", async (_, res) => {
  const wx = await getCurrentWxRaw();
  res.send(wx);
});

module.exports = {
  notifyRunwayInUseNtfy,
  router,
};
