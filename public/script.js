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

    // Check if there is an error in the response
    if (data.error) {
      // Show the error modal and display the error message
      document.getElementById('errorMessage').innerText = data.error;
      positionErrorModal(); // Position the error modal dynamically
      document.getElementById('errorModal').classList.remove('hidden');
      return; // Stop further execution
    }

    const format = (val) => (val == null || val === 0 ? 'Private' : val);

    let content = `
      <h2>${data.personaname || "Unknown User"}</h2>
      <img src="${data.avatarmedium}" alt="Avatar">
      <p>Account Created: ${data.creationDate ? new Date(data.creationDate * 1000).toDateString() : 'Private'}</p>
      <p>Friends: ${format(data.friendsCount)} (Score: ${format(data.friendsScore)}%)</p>
      <p>Games Owned: ${format(data.totalGames)} (Score: ${format(data.gamesScore)}%)</p>
      <p>Total Playtime: ${format(data.totalPlaytime)} hours</p>
      <h3>Final Score: ${format(data.finalScore)}%</h3>
    `;

    document.getElementById('profile').innerHTML = content;

  } catch (error) {
    console.error('Error:', error);
    // Show the error modal and display a general error message
    document.getElementById('errorMessage').innerText = 'An error occurred while fetching data.';
    positionErrorModal(); // Position the error modal dynamically
    document.getElementById('errorModal').classList.remove('hidden');
  } finally {
    // Hide loading spinner after the data is fetched (or error is displayed)
    document.getElementById('loadingSpinner').classList.add('d-none');
  }
}

// Function to dynamically position the error modal based on navbar position
function positionErrorModal() {
  const navbar = document.querySelector('nav'); // Assuming your navbar has the <nav> tag
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  const errorModal = document.getElementById('errorModal');
  
  // Position the modal above or below the navbar
  const modalTopPosition = navbarHeight + 10; // 10px space between the navbar and modal
  
  errorModal.style.top = `${modalTopPosition}px`; // Apply the top position dynamically
}

// Hide the error modal when "Retry" is clicked
document.getElementById('retryButton').onclick = function () {
  document.getElementById('errorModal').classList.add('hidden');
};
