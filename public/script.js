async function fetchSteamData() {
  const steamID = document.getElementById('steamID').value;
  if (!steamID) {
    document.getElementById('profile').innerHTML = '<p>Please enter a Steam ID.</p>';
    return;
  }

  // Show loading spinner
  document.getElementById('loadingSpinner').classList.remove('d-none');

  try {
    const response = await fetch('/api/steam-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamID })
    });

    const data = await response.json();

    if (data.error) {
      document.getElementById('profile').innerHTML = `<p>${data.error}</p>`;
    } else {
      const format = (val) => (val == null || val === 0 ? 'Private Account' : val);

      let content = `
        <h2>${data.personaname || "Unknown User"}</h2>
        <img src="${data.avatarmedium}" alt="Avatar">
        <p>Account Created: ${data.creationDate ? new Date(data.creationDate * 1000).toDateString() : 'Private Account'}</p>
        <p>Friends: ${format(data.friendsCount)} (Score: ${format(data.friendsScore)}%)</p>
        <p>Games Owned: ${format(data.totalGames)} (Score: ${format(data.gamesScore)}%)</p>
        <p>Total Playtime: ${format(data.totalPlaytime)} hours</p>
        <h3>Final Score: ${format(data.finalScore)}%</h3>
      `;

      document.getElementById('profile').innerHTML = content;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('profile').innerHTML = '<p>An error occurred while fetching data.</p>';
  } finally {
    document.getElementById("loadingSpinner").classList.add('d-none');
  }
}

// Popup placement
window.onload = function () {
  document.getElementById("termsPopup").style.display = "flex";
};

document.getElementById('agreeButton').onclick = function () {
  document.getElementById('termsPopup').style.display = 'none';
};
