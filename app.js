const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("This server is running in http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//List Of All Players
app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details GROUP BY player_id;`;
  const playerArray = await db.all(query);
  response.send(
    playerArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//Returns a Specific Player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details 
    WHERE player_id = ${playerId};`;
  const findPlayer = await db.get(query);
  response.send(convertDbObjectToResponseObject(findPlayer));
});

//Update Player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const query = `UPDATE player_details SET 
  player_name ='${playerName}'
    WHERE player_id = ${playerId};`;
  const newPLayer = await db.run(query);
  response.send("Player Details Updated");
});

//Return Matches
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(query);
  response.send(convertDbObjectToResponseObject(match));
});

//Return Player Matches
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT match_details.match_id AS matchId,
  match_details.match AS match, match_details.year AS year 
  FROM player_match_score NATURAL JOIN match_details
    WHERE 
       player_id = ${playerId};`;
  const player = await db.all(query);
  response.send(
    player.map((eachPlayer) => convertDbObjectToResponseObject(eachPLayer))
  );
});

//Returns a Player
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const player = await db.all(query);
  response.send(player);
});

const convertObjectToResponse = (object) => {
  return {
    totalFours: object.fours,
    totalSixes: object.sixes,
    totalScore: object.score,
  };
};

//Total
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(query);
  response.send(player);
});

module.exports = app;
