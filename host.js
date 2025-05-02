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
		const playerData = await getPlayerData(steamID);
		if (!playerData) return res.json({ error: 'Player not found.' });

		if (playerData.communityvisibilitystate !== 3) {
			return res.json({ error: 'This profile is private or friends-only.' });
		}

		const [gamesData, friendsData] = await Promise.all([
			getOwnedGames(steamID),
			getFriendsList(steamID)
		]);

		const finalScore = calculateFinalScore([gamesData?.score, friendsData?.score, playerData.createdScore]);

		res.json({
			personaname: playerData.personaname,
			avatarmedium: playerData.avatarmedium,
			creationDate: playerData.timecreated,
			totalGames: gamesData?.totalGames || 0,
			totalPlaytime: gamesData?.totalPlaytime || 0,
			gamesScore: gamesData?.score || 0,
			friendsCount: friendsData?.friendsCount || 0,
			friendsScore: friendsData?.score || 0,
			finalScore
		});
	} catch (error) {
		console.error(error);
		res.json({ error: 'An error occurred while fetching data.' });
	}
});

// Fetch player profile
async function getPlayerData(steamID) {
	try {
		const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamID}`);
		return response.data.response.players[0] || null;
	} catch (error) {
		console.error('Error fetching player data:', error);
		return null;
	}
}

// Fetch owned games
async function getOwnedGames(steamID) {
	try {
		const response = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamID}&format=json`);
		const games = response.data.response.games || [];
		const totalGames = response.data.response.game_count || 0;
		const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0) / 60;
		const score = Math.max(5, Math.min(95, -5 * totalGames + 100));
		
		if (totalGames == 0) score = 0; // Fix for issue falsely reporting 95% scores for accounts with private games

		return { totalGames, totalPlaytime, score };
	} catch (error) {
		console.error('Error fetching owned games:', error);
		return null;
	}
}

// Fetch friends list
async function getFriendsList(steamID) {
	try {
		const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${API_KEY}&steamid=${steamID}&relationship=friend`);
		const friendsCount = response.data.friendslist?.friends.length || 0;
		const score = Math.max(5, Math.min(95, 75 - 5 * friendsCount));

		return { friendsCount, score };
	} catch (error) {
		console.error('Error fetching friends list:', error);
		return null;
	}
}

// Calculate final score
function calculateFinalScore(scores) {
	const validScores = scores.filter(score => score !== undefined);
	if (validScores.length === 0) return 'Insufficient data';

	return Math.round(Math.max(5, Math.min(95, validScores.reduce((sum, score) => sum + score, 0) / validScores.length)));
}

// Start server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
});