const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");

let todaysGame = "";

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

router.get("/", (_, res) => res.send(todaysGame));

module.exports = {
  notifyGameDayNtfy,
  router,
};
