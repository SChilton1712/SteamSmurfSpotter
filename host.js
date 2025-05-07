const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;
const API_KEY = process.env.STEAM_API_KEY;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

app.get('/', (req, res) => {
	res.redirect('/index.html'); // Redirect to the correct file
});


// API to fetch Steam data as JSON
app.post('/api/steam-data', async (req, res) => {
	const steamID = req.body.steamID;

	try {
		// Get basic player profile data
		const playerData = await getPlayerData(steamID);
		if (!playerData) {
			return res.json({ error: 'Player not found.' });
		}

		// Check if profile is public
		if (playerData.communityvisibilitystate !== 3) {
			return res.json({ error: 'This profile is private or friends-only.' });
		}

		// Fetch owned games and friends list in parallel
		const [gamesData, friendsData] = await Promise.all([
			getOwnedGames(steamID),
			getFriendsList(steamID)
		]);

		// Prepare scores and count metrics available
		const scores = [
			gamesData?.score,
			friendsData?.score,
			playerData.createdScore
		];

		const availableMetrics = scores.filter(score => score !== undefined).length;
		const finalScore = calculateFinalScore(scores);

		// Respond with structured result
		res.json({
			personaname: playerData.personaname,
			avatarmedium: playerData.avatarmedium,
			creationDate: playerData.timecreated,
			totalGames: gamesData?.totalGames || 0,
			totalPlaytime: gamesData?.totalPlaytime || 0,
			gamesScore: gamesData?.score || 0,
			friendsCount: friendsData?.friendsCount || 0,
			friendsScore: friendsData?.score || 0,
			finalScore,
			availableMetrics
		});

	} catch (error) {
		console.error('API error:', error);
		res.json({ error: 'An error occurred while fetching data.' });
	}
});

// --- Helper Functions ---

// Fetch player profile
async function getPlayerData(steamID) {
	try {
		const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamID}`;
		const response = await axios.get(url);
		const player = response.data.response.players[0];

		if (!player) return null;

		// Example score from account creation (add logic as needed)
		const createdScore = player.timecreated ? calculateAccountAgeScore(player.timecreated) : undefined;

		return {
			...player,
			createdScore
		};
	} catch (error) {
		console.error('Error fetching player data.');
		return null;
	}
}

// Calculate a score based on account age
function calculateAccountAgeScore(timecreated) {
	const accountAgeYears = (Date.now() / 1000 - timecreated) / (60 * 60 * 24 * 365);
	return Math.max(5, Math.min(95, accountAgeYears * 10));
}

// Fetch owned games
async function getOwnedGames(steamID) {
	try {
		const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamID}&format=json`;
		const response = await axios.get(url);
		const games = response.data.response.games || [];

		const totalGames = response.data.response.game_count || 0;
		const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0) / 60;

		// Basic scoring logic
		const score = Math.max(5, Math.min(95, -5 * totalGames + 100));

		return { totalGames, totalPlaytime, score };
	} catch (error) {
		console.error('Error fetching owned games.');
		return null;
	}
}

// Fetch friends list
async function getFriendsList(steamID) {
	try {
		const url = `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${API_KEY}&steamid=${steamID}&relationship=friend`;
		const response = await axios.get(url);

		const friendsCount = response.data.friendslist?.friends.length || 0;
		const score = Math.max(5, Math.min(95, 75 - 5 * friendsCount));

		return { friendsCount, score };
	} catch (error) {
		console.error('Error fetching friends list.');
		return null;
	}
}

// Calculate final score
function calculateFinalScore(scores) {
	const validScores = scores.filter(score => score !== undefined);
	if (validScores.length === 0) return 'Insufficient data';

	const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
	return Math.round(Math.max(5, Math.min(95, average)));
}

// Start server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
});