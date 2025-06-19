require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const dayjs = require("dayjs");

const app = express();
const port = 3000;

app.set("view engine", "ejs");

let todaysFlights;
let todaysGame = "";
let onceFlag = false;

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

const notifyGameDayNtfy = async () => {
  const game = await getGameday();
  if (game) {
    try {
      fetch(`http://${process.env.HOST_IP}/gameday`, {
        method: "POST",
        body: `Red Sox ${game}`,
      });
    } catch (error) {
      console.log("Notification error: ", error);
    }
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

const getGameday = async () => {
  const today = dayjs().format("YYYY-MM-DD");
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?hydrate=team&sportId=1&startDate=${today}&endDate=${today}&teamId=111`
  );
  const teamData = await res.json();

  if (teamData.totalGames >= 1) {
    const game = teamData.dates[0].games[0];
    // NOTE: dayjs.local() is not working despite the host machine and container having the correct time.
    // Also tried explicitly setting the timezone with no luck. Since baseball season is always EDT there shouldnt be an issue here.
    const gameTime = dayjs(game.gameDate).subtract(4, "hour").format("hh:mm A");
    let opponent = "";

    if (game.teams.away.team.teamCode !== "bos") {
      opponent = `VS ${game.teams.away.team.teamName.toUpperCase()}`;
    } else {
      opponent = `AT ${game.teams.home.team.teamName.toUpperCase()}`;
    }

    todaysGame = `${opponent} ${gameTime}`;
  } else {
    todaysGame = "NO GAME TODAY";
  }
  return todaysGame;
};

const getFlights = async () => {
  const airportId = "KBED";
  const res = await fetch(
    `https://aeroapi.flightaware.com/aeroapi/airports/${airportId}/flights`,
    {
      headers: {
        "x-apikey": process.env.FLIGHTAWARE_API_KEY,
      },
    }
  );
  const flights = await res.json();
  todaysFlights = flights;
  return flights;
};

app.get("/", async (_, res) => {
  const wx = await getCurrentWxRaw();
  res.send(wx);
});

app.get("/sox", async (_, res) => {
  res.send(todaysGame);
});

app.get("/flights", async (_, res) => {
  if (todaysFlights) {
    res.render("flights.ejs", {
      arrivals: todaysFlights.scheduled_arrivals,
      departures: todaysFlights.scheduled_departures,
    });
  } else {
    res.send("Unable to get flights for the day. See logs.");
  }
});

app.listen(port, () => {
  console.log(`Metar app listening on port ${port}`);
});

cron.schedule("*/30 * * * *", async () => {
  await notifyRunwayInUseNtfy();
});

cron.schedule("0 10 * * *", async () => {
  await notifyGameDayNtfy();
  await getFlights();
});
