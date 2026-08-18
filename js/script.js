const clientId = '2a99961c31824a0bb28c08c0f6456955';    
const redirectUri = 'https://epaul04.github.io/findInPlaylists/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
let id = "";
let playlistsGlobal = "blank";
let songGlobal = null;


// ================================================== API stuff =======================================================
// take user to spotify API login page and navigate to redirect page
async function login() {
    // from spotify's API guide: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow 
    
    // step 1: code challenge
    const generateRandomString = (length) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = crypto.getRandomValues(new Uint8Array(length));
      return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }
    
    const codeVerifier  = generateRandomString(64);
    
    const sha256 = async (plain) => {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return window.crypto.subtle.digest('SHA-256', data)
    }
    
    const base64encode = (input) => {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }
    
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    
    // step 2: user authentication
    
    const scope = 'user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative'; //TODO: remember to update this as needed
    const authUrl = new URL("https://accounts.spotify.com/authorize")
    
    // generated in the previous step
    window.localStorage.setItem('code_verifier', codeVerifier);
    
    const params =  {
      response_type: 'code',
      client_id: clientId,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    }
    
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
    
}

// get access token and store in local storage
async function getToken() {
  const codeVerifier = localStorage.getItem('code_verifier');
  const url = "https://accounts.spotify.com/api/token";
  const payload = {
    method: 'POST',
    headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    })
  }

  const response = await fetch(url, payload);
  const data = await response.json();   
  localStorage.setItem('access_token', data.access_token);
}

async function findSong() {
    getToken();
    let token = localStorage.getItem("access_token");
    let params = null;

    // get input values
    let title= document.getElementById("title").value;
    let artist = document.getElementById("artist").value;

    
    // if both title and artist:
    if ((title != "") && (artist != "")) {
        params = new URLSearchParams({
            q: `track%2520${title}%2520artist%2520${artist}`,
            type: "track"
        });
    }
    
    // if only title:
    if (artist == "") {
        params = new URLSearchParams({
            q: `track%2520${title}`,
            type: "track"
        });
    }
    
    const findSong = await fetch(`https://api.spotify.com/v1/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await findSong.json();

    songGlobal = result.tracks.items[0];
    
    alert("name " + result.tracks.items[0].name);
    alert("id " + result.tracks.items[0].id);

    // now compare and update display ====================================================================
      const songRequestFinal = await fetch(`https://api.spotify.com/v1/tracks/${result.tracks.items[0].id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const features = await songRequestFinal.json();

    document.getElementById("display-title").textContent = features.name;
    document.getElementById("display-artists").textContent = "";
    let i = 0;
    for (; i < features.artists.length - 1; i++) {
        document.getElementById("display-artists").textContent += features.artists[i].name + ", ";
    }
    document.getElementById("display-artists").textContent += features.artists[i].name;
    
    alert("resetting");
    document.getElementById("display-album").textContent = features.album.name;
    document.getElementById("display-image").src = features.album.images[0].url;

    checkAllPlaylists(result.tracks.items[0]);

    return false;
}

async function checkAllPlaylists(song) {
    // getToken();
    let token = localStorage.getItem("access_token");

    // get all playlists from user's library
    const playlistRequest = await fetch(`https://api.spotify.com/v1/me/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await playlistRequest.json();

    // check for song in each
    result.items.forEach(async playlist => {
        // alert("playlist " + playlist.name);
        const playlistRequest2 = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result2 = await playlistRequest2.json();
        result2.items.forEach(song => {
            if (song.name == songGlobal.name) {
                alert(playlist + " has song");
                playlistsGlobal += playlist + ", ";
            }
        })
    });
    document.getElementById("display-playlist").textContent = playlistsGlobal;
}


// NOTE: for reference only, remove later!!! ------------------------------------------------------------------------------------------------------------------

async function getSongFeatures(songName) {
//   getToken();
  let token = localStorage.getItem("access_token");
  // turn songName into actual track object
  const findSong = await fetch(`https://api.spotify.com/v1/search?q=${songName}&type=track`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await findSong.json();
  console.log(result);
  const id = result.tracks.items[0].id;
  const songRequestFinal = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const features = await songRequestFinal.json();

  // get playlist the song is on
//   getToken();
  token = localStorage.getItem("access_token");
  const check = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const inPlaylist = await check.json();
  let playlist = inPlaylist[0];

  // get artist
  let artists = features.artists;

  // get album
  let album = features.album.name;


  // now compare and update display ====================================================================
  for (let i = 0; i < artists.length; i++) {
    for (let j = 0; j < artistsGlobal.length; j++) {
      if (artists[i].name == artistsGlobal[j].name) {
        if (!document.getElementById("display-artists").textContent.includes(artists[i].name)) {
          document.getElementById("display-artists").textContent += artists[i].name;
          document.getElementById("display-artists").textContent.replace("(artist)", "");
        }
      }
    }
  }
  
  if (album == albumGlobal.name) {
    document.getElementById("display-album").textContent = album.name;
    getAlbumCover(albumGlobal);
  }
}