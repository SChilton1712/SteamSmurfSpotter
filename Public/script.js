async function fetchSteamData() {
    const steamID = document.getElementById('steamID').value; // Get the Steam ID entered by the user

    if (!steamID) {
      document.getElementById('profile').innerHTML = '<p>Please enter a Steam ID.</p>';
      return;
    }

    try {
      // Send a POST request with the Steam ID in the body
      const response = await fetch('/api/steam-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ steamID })
      });

      const data = await response.json();

      if (data.error) {
        document.getElementById('profile').innerHTML = `<p>${data.error}</p>`;
        return;
      }

      // Generate HTML content dynamically with the fetched data
      let content = `
            <h2>${data.personaname}</h2>
            <img src="${data.avatarmedium}" alt="Avatar">
            <p>Account Created: ${new Date(data.creationDate * 1000).toDateString()}</p>
            <p>Friends: ${data.friendsCount} (Score: ${data.friendsScore}%)</p>
            <p>Games Owned: ${data.totalGames} (Score: ${data.gamesScore}%)</p>
            <p>Total Playtime: ${data.totalPlaytime} hours</p>
            <h3>Final Score: ${data.finalScore}%</h3>
        `;

      document.getElementById('profile').innerHTML = content;
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('profile').innerHTML = '<p>An error occurred while fetching data.</p>';
    }
  }
