const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const currentPort = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Runs on start, instantiates text input box and submit button for SteamID
app.get
(
	'/', (req, res) =>
	{
		res.send
		(
			`<form method="POST" action="/submit">
				<input type="text" name="steamID" placeholder="Enter Steam ID here..." required>
				<button type"submit">Submit</button>
			</form>`
		);
	}
);

// Runs when user presses submit after entering SteamID
app.post
(
	'/submit', async (req, res) =>
	{
		const steamID = req.body.steamID; // Steam ID pulled from text input box
		const apiKey = '5146BE01C762080D70CBEFF7E003EBB4' // My API key
		
		// Uses Axios to pull player info from Steam
		try
		{
			const axiosResponse = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamID}`); // Gets player data from Steam
			const playerData = axiosResponse.data.response.players[0]; // Gets data from Steam's response
			let outputs = [];
			
			if (playerData)
			{
				var visibilityState = playerData.communityvisibilitystate;
				
				// Basic player data
				outputs.push
				(
					`<h1>Player Info</h1>
					<p>Display Name: ${playerData.personaname}</p>
					<img src="${playerData.avatarmedium}" alt="AvatarPic"/>
					<br>`
				);
				
				if (visibilityState == 3)
				{
					outputs.push('This profile is set to public' + `<br>`);
					
					var gamesScore = -1;
					var playtimeScore = -1;
					
					// getting total games and average play time
					try 
					{
						const gamesList = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamID}&format=json`); // Gets owned games from Steam
						
						var totalGames = gamesList.data.response.game_count;
						
						var totalPlaytime = 0;
						var averagePlaytime = 0;
						for	(let index = 0; index < gamesList.data.response.games.length; index++)
						{
							totalPlaytime += gamesList.data.response.games[index].playtime_forever;
						}
						
						totalPlaytime /= 60;
						averagePlaytime = totalPlaytime / totalGames;
						averagePlaytime = Math.round(averagePlaytime);
						
						gamesScore = -5 * totalGames + 100;
						if (gamesScore > 95) { gamesScore = 95; }
						else if (gamesScore < 5) { gamesScore = 5; }
						
						playtimeScore = (100 * averagePlaytime) / totalPlaytime;
						if (playtimeScore > 95) { playtimeScore = 95; }
						else if (playtimeScore < 5) { playtimeScore = 5; }
						
						console.log('Games owned: ' + totalGames);
						console.log('Total playtime: ' + totalPlaytime);
						console.log('Average playtime: ' + averagePlaytime);
						
						outputs.push('Games owned: ' + totalGames);
						outputs.push('Total playtime: ' + totalPlaytime);
						outputs.push('Average playtime: ' + averagePlaytime + ' hours');
						
						outputs.push(`<br>` + 'Games score: ' + gamesScore + '%');
						outputs.push('Playtime score: ' + playtimeScore + '%' + `<br>`);
					}
					catch (error)
					{
						outputs.push('Games list set to private' + `<br>`);
						console.log('Games list set to private');
					}
					
					var friendsScore = -1;
					
					// getting friends list
					try
					{
						const friendsList = await axios.get(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${apiKey}&steamid=${steamID}&relationship=friend`);
						
						var friendsCount = friendsList.data.friendslist.friends.length;
						
						friendsScore = 75 - (5 * friendsCount);
						if (friendsScore > 95) { friendsScore = 95; }
						else if (friendsScore < 5) { friendsScore = 5; }
						
						console.log('Friend count: ' + friendsCount);
						outputs.push('Friend count: ' + friendsCount + `<br>`);
						
						outputs.push('\nFriends score: ' + friendsScore + '%' + `<br>`);
					}
					catch (error)
					{
						outputs.push('Friends list set to private' + `<br>`);
						console.log('Friends list set to private');
					}
					
					var createdScore = -1;
					
					// getting creation date
					try
					{
						var unixTimeCreated = playerData.timecreated;
						var dateTimeCreated = new Date(unixTimeCreated * 1000);
						
						createdScore = 2628288 / (unixTimeCreated);
						
						if (createdScore > 95) { createdScore = 95; }
						else if (createdScore < 5) { createdScore = 5; }
						
						outputs.push('Account created on: ' + dateTimeCreated + `<br>`);
						outputs.push('Creation score: ' + createdScore + '%' + `<br>`);
					}
					catch (error)
					{
						outputs.push('Account creation date set to private' + `<br>`);
						console.log('Account creation date set to private');
					}
					
					var finalScore = 0;
					var scoresUsed = 0;
					
					if (gamesScore > -1)
					{
						finalScore += gamesScore;
						scoresUsed++;
					}
					if (playtimeScore > -1)
					{
						finalScore += playtimeScore;
						scoresUsed++;
					}
					if (friendsScore > -1)
					{
						finalScore += friendsScore;
						scoresUsed++;
					}
					if (createdScore > -1)
					{
						finalScore += createdScore;
						scoresUsed++;
					}
					
					finalScore /= scoresUsed;
					
					if (finalScore > 95) { finalScore = 95; }
					else if (finalScore < 5) { finalScore = 5; }
					
					outputs.push(`<h2>Final score: ${finalScore}%</h2>`);
					console.log('Final score: ' + finalScore);
				}
				else
				{
					outputs.push('This profile is set to private or friends only');
					outputs.push('Further data is unavailable');
				}
				
				// Outputs all messages above
				res.send(outputs.join(`<br>`));
			}
			else
			{
				// Runs if player was not found
				res.send('Player not found.');
			}
		}
		catch (error)
		{
			console.log(error);
			res.send('An error occurred.');
		}
	}
);

// Runs at start, creates local server on currentPort
app.listen
(
	currentPort, () =>
	{
		console.log(`Server running at http://localhost:${currentPort}/`);
	}
);