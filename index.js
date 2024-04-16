const https = require("https");
const express = require("express");
const app = express();
const port = 3000;

// https://aviationweather.gov/api/data/metar?ids=KBED&format=raw&taf=false&hours=0
/*
curl -X 'GET' \
  'https://aviationweather.gov/api/data/metar?ids=KBED&format=raw&taf=false&hours=0' \
*/
// -H 'accept: */*'

const getCurrentWx = async () => {
  const res = await fetch(
    "https://aviationweather.gov/api/data/metar?ids=KBED&format=raw&taf=false&hours=0"
  );
  const wx = await res.text();
  return wx;
};

app.get("/", async (req, res) => {
  const wx = await getCurrentWx();
  res.send(wx);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
