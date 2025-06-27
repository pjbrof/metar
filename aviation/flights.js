const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");

// const exampleFlights = require("../examples/flightaware.json");
const aircraft = require("../examples/aircraftIdent.json");

const getAircraftDescription = (type) => {
  const aIndex = aircraft.findIndex(({ icaoCode }) => type === icaoCode);
  return aircraft[aIndex]?.description ?? type;
};

const formatFlightData = (data) => {
  const arrivals = data.scheduled_arrivals
    .sort((a, b) => new Date(a.scheduled_on) - new Date(b.scheduled_on))
    .map((item) => {
      return {
        ...item,
        aircraft_type: getAircraftDescription(item.aircraft_type),
        scheduled_on: dayjs(item.scheduled_on).format("hh:mm a"),
      };
    });
  const departures = data.scheduled_departures
    .sort((a, b) => new Date(a.scheduled_off) - new Date(b.scheduled_off))
    .map((item) => {
      return {
        ...item,
        aircraft_type: getAircraftDescription(item.aircraft_type),
        scheduled_off: dayjs(item.scheduled_off).format("hh:mm a"),
      };
    });

  return {
    arrivals,
    departures,
  };
};

let todaysFlights;

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
  todaysFlights = formatFlightData(flights);
};

router.get("/", (_, res) => {
  if (todaysFlights) {
    res.render("flights.ejs", {
      day: dayjs().format("MMM DD"),
      arrivals: todaysFlights.arrivals,
      departures: todaysFlights.departures,
    });
  } else {
    res.send("Unable to get flights for the day. See logs.");
  }
});

module.exports = {
  getFlights,
  router,
};
