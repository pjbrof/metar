require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const app = express();
const port = 3000;

const notifyRunwayInUseNtfy = async () => {
  const currentWx = await getCurrentWxJSON();
  if (currentWx.wdir >= 70 && currentWx.wdir <= 160) {
    try {
      fetch(`http://${process.env.HOST_IP}/activerunway`, {
        method: "POST",
        body: `Runway 11 in use 🛫 \n${currentWx.rawOb}`,
      });
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
    const gameTime = dayjs(game.gameDate).local().format("hh:mm A");
    let opponent = "";

    if (game.teams.away.team.teamCode !== "bos") {
      opponent = `VS ${game.teams.away.team.teamName.toUpperCase()}`;
    } else {
      opponent = `AT ${game.teams.home.team.teamName.toUpperCase()}`;
    }

    return `${opponent} ${gameTime}`;
  } else {
    return "NO GAME TODAY";
  }
};

app.get("/", async (_, res) => {
  const wx = await getCurrentWxRaw();
  res.send(wx);
});

app.get("/sox", async (_, res) => {
  const game = await getGameday();
  res.send(game);
});

app.listen(port, () => {
  console.log(`Weather app listening on port ${port}`);
});

cron.schedule("*/30 * * * *", async () => {
  await notifyRunwayInUseNtfy();
});

cron.schedule("0 6 * * *", async () => {
  await notifyGameDayNtfy();
});
