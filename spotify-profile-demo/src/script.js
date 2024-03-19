const clientId = "Your_Client_ID";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const logginButton = document.getElementById("loginButton");
const profileElement = document.getElementById("profile");
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const goBackButton = document.getElementById("goBackButton");
const logoutButton = document.getElementById("logoutButton");

goBackButton.addEventListener("click", async () => {
    // Hide search input, results, and "Go Back" button
    searchInput.style.display = "none";
    document.getElementById("searchResults").style.display = "none";
    goBackButton.style.display = "none";

    // Fetch data again
    accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const topTracks = await fetchTopTracks(accessToken);
    const playlists = await fetchPlaylists(accessToken);

    // Populate UI
    populateUI(profile);
    populateTopTracks(topTracks);
    populatePlaylists(playlists);
    populateSearchResults(results);

    // Show user's info
    document.getElementById("profile").style.display = "block";
    document.getElementById("info").style.display = "block";
    document.getElementById("topTracks").style.display = "block";
    document.getElementById("playlists").style.display = "block";
    document.getElementById("searchBar").style.display = "block";
});

window.onpopstate = () => {
   
    searchInput.style.display = "none";
    document.getElementById("searchResults").style.display = "none";
    goBackButton.style.display = "none";

    // Show user's info
    document.getElementById("profile").style.display = "block";
    document.getElementById("info").style.display = "block";
    document.getElementById("topTracks").style.display = "block";
    document.getElementById("playlists").style.display = "block";
    document.getElementById("searchBar").style.display = "block"; 
};


searchButton.addEventListener("click", async () => {
    const query = searchInput.value;

    goBackButton.style.display = "block"; 




    if (query.trim() !== "") {
        try {
            const results = await searchSongs(query, accessToken);

         
            document.getElementById("profile").style.display = "none";
            document.getElementById("info").style.display = "none";
            document.getElementById("topTracks").style.display = "none";
            document.getElementById("playlists").style.display = "none";

            searchInput.style.display = "block";
            document.getElementById("searchResults").style.display = "block";

            populateSearchResults(results);

            history.pushState({}, '');
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        console.log("Search query cannot be empty");
    }
});



searchInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        searchButton.click();
    }
});


searchInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        const query = searchInput.value;
        const results = await searchSongs(query, accessToken);

       
        document.getElementById("profile").style.visibility = "hidden";
        document.getElementById("info").style.visibility = "hidden";
        document.getElementById("topTracks").style.visibility = "hidden";
        document.getElementById("playlists").style.visibility = "hidden";

   
        searchInput.style.visibility = "visible";
        document.getElementById("searchResults").style.visibility = "visible";
        goBackButton.style.visibility = "visible";

        populateSearchResults(results);
    }
});
searchButton.addEventListener("click", () => {
    if (searchInput.style.display === "none") {
        searchInput.style.display = "block"; 
    } else {
        searchInput.style.display = "none"; 
    }
});



logginButton.addEventListener("click", () => {

    if (!code) {
        redirectToAuthCodeFlow(clientId);

    }
});

document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("verifier");
    location.reload();
}
);


let accessToken = null;
const searchBar = document.getElementById("searchBar");

if (code) {
    logoutButton.style.display = "block";
    logginButton.style.display = "none";
    searchBar.style.display = "block"; 
    accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const topTracks = await fetchTopTracks(accessToken);
    const playlists = await fetchPlaylists(accessToken);
    console.log(playlists);
    console.log(profile);
    populateUI(profile);
    populateTopTracks(topTracks);
    populatePlaylists(playlists);
} else {
    logginButton.style.display = "block";
    logoutButton.style.display = "none";
    searchBar.style.display = "none"; // Hide the search bar
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    if (!result.ok) {
        window.location = "http://localhost:5173";
    }
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}
async function fetchTopTracks(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=21&time_range=long_term", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI(profile) {

    if (profile.images[0]) {
        profileElement.innerHTML = `
            <h2>Logged in as <span id="displayName">${profile.display_name}</span></h2>
            <img src="${profile.images[0].url}">
            <ul id="profileInfo">
                <li>User ID: <span id="id">${profile.id}</span></li>
                <li>Email: <span id="email">${profile.email}</span></li>
                <li>Spotify URI: <a id="uri" href="${profile.external_urls.spotify}">${profile.uri}</a></li>
                <li>Link: <a id="url" href="${profile.href}">${profile.href}</a></li>
                <li>Profile Image: <span id="imgUrl">${profile.images[0].url}</span></li>
                <li>Country: <span id="country">${profile.country}</span></li>
            </ul>
            <table id="topTracks"></table>
        `;
    }

}
function populateTopTracks(topTracks) {
    const table = document.getElementById("topTracks");
    let row = null;
    let count = 1; // Initialize the counter

    topTracks.items.forEach((track, index) => {
        if (index % 3 === 0) { // Create a new row for every 3 tracks
            row = document.createElement("tr");
            table.appendChild(row);
        }

        const cell = document.createElement("td");
        const link = document.createElement("a");
        link.href = track.external_urls.spotify; // The URL to the track on Spotify
        link.target = "_blank"; // Open the link in a new tab
        link.innerText = `${count}. ${track.name} by ${track.artists[0].name}`; // Add the counter before the track name
        cell.appendChild(link);
        row.appendChild(cell);

        count++; // Increment the counter
    });
}

async function fetchPlaylists(accessToken) {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET", headers: { Authorization: `Bearer ${accessToken}` }
    });

    return await result.json();
}

function populatePlaylists(playlists) {
    const container = document.getElementById("playlists");
    container.innerHTML = ""; // Clear the container

    playlists.items.slice(0, 6).forEach((playlist, index) => {
        const box = document.createElement("div");
        box.className = "playlistBox"; // Add the playlistBox class to the box
        const link = document.createElement("a");
        link.href = playlist.external_urls.spotify; // The URL to the playlist on Spotify
        link.target = "_blank"; // Open the link in a new tab
        link.innerText = `${index + 1}. ${playlist.name}`;
        box.appendChild(link);
        container.appendChild(box);
    });
}
document.getElementById("searchButton").addEventListener("click", async () => {
    const query = document.getElementById("searchInput").value;
    const results = await searchSongs(query, accessToken);
    populateSearchResults(results);
});
async function searchSongs(query, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${query}`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.tracks) {
        throw new Error('No tracks found');
    }

    return data;
}

function populateSearchResults(results) {
    const container = document.getElementById("searchResults");
    container.innerHTML = ""; // Clear the container

    results.tracks.items.forEach((track, index) => {
        const div = document.createElement("div");
        div.innerText = `${index + 1}. ${track.name} by ${track.artists.map(artist => artist.name).join(", ")}`;
        container.appendChild(div);
    });
}
document.getElementById("searchButton").addEventListener("click", async () => {
    const query = document.getElementById("searchInput").value;
    const results = await searchSongs(query, accessToken);

    // Hide other elements

    document.getElementById("profile").style.display = "none";
    document.getElementById("info").style.display = "none";
    document.getElementById("topTracks").style.display = "none";
    document.getElementById("playlists").style.display = "none";

    // Show search results
    document.getElementById("searchResults").style.display = "block";
    populateSearchResults(results);
});

async function fetchCurrentPlayingTrack(accessToken) {
    if (!accessToken) {
        redirectToAuthCodeFlow(clientId);
        return;
    }

    const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        method: "GET", headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!result.ok) {
        if (result.status === 401) {
            // Access token is invalid, redirect to login page
            redirectToAuthCodeFlow(clientId);
        } else {
            throw new Error(`HTTP error! status: ${result.status}`);
        }
    }

    return await result.json();
}