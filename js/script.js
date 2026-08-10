const clientId = '2a99961c31824a0bb28c08c0f6456955';    
const redirectUri = 'https://epaul04.github.io/findInPlaylist/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');


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
    
    const scope = 'user-read-private user-read-email playlist-read-private user-library-read';
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

// requests user's profile from spotify using access token stored in local storage
async function requestProfile() {
  // get access token
  try {
    await getToken();
  } catch (error) {
    console.log("ERROR: " + error);
  }
  let token = localStorage.getItem("access_token");

  // get profile using access token
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET", headers: { Authorization: "Bearer " + token }
  });  
  const profile = await result.json();

  // set text to reflect display name
  document.getElementById("name").innerText = profile.display_name;
}

function findSong() {
    // get input values
    let title= document.getElementById("title").value;
    let artist = document.getElementById("artist").value;

    // if nothing entered, skip submission
    if ((title == "") && (artist == "")) {
        alert("nothing to submit!");
        return false;
    }

    // otherwise, collect info for params and send request
    if (title == "") {
        alert("no title");
    }
    else {
        alert(title);
    }
    if (artist == "") {
        alert("no artist");
    }
    else {
        alert(artist);
    }
    return false;
}