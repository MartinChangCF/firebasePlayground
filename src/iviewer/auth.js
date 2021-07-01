/* 
// You need to use below package.json for this auth.js execution
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "dependencies": {
    "@babel/preset-env": "^7.12.1",
    "axios": "^0.21.1",
    "firebase": "^7.24.0",
    "firebase-admin": "^9.2.0",
    "firebase-functions": "^3.11.0",
    "form-data": "^4.0.0",
    "google-auth-library": "^6.1.2",
    "googleapis": "^61.0.0",
    "https": "^1.0.0",
    "lodash": "^4.17.20",
    "node-schedule": "^1.3.2"
  },
  "scripts": {
    "start": "babel-node ./src/index.js"
  },
  "private": true,
  "devDependencies": {
    "@babel/cli": "^7.12.1",
    "@babel/core": "^7.12.3",
    "@babel/node": "^7.12.1"
  },
  "babel": {
    "presets": [
      "@babel/preset-env"
    ]
  }
}

*/

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  getAccessToken(oAuth2Client)
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
}

const crendentails = {
  installed: {
    'client_id': '885665378430-99mb6j2hlqmmiv9iff59dto6212jtelf.apps.googleusercontent.com',
    'project_id': 'expanded-net-189111',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://accounts.google.com/o/oauth2/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_secret': 'Klp7igLTbjfPZWFZrnf3KznI',
    'redirect_uris': ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost']
  }
}
authorize(crendentails);
