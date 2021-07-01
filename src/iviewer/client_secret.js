// This json contains the authed data of the google api
// Don't modify unless you know what to do

// 20210701 using martin.chang.cf@gmail.com
export let credentials = {
  'access_token': 'ya29.a0ARrdaM8M3dLezNlx8ZQQwLtxyKbVIpiq3TNbtjplKRldSL9S7f--Edego_pc6YVEd8dnMdpO4Rzz8QAijKcFd_tajo_3Wp012vH2WkneGhh069gU3QOqQUYoXjkABUSz61UnmnGb3X8IhHRsRHdQSHNCYKif',
  'refresh_token': '1//0eF1zm05a3DMRCgYIARAAGA4SNwF-L9Irk_D6ykY1m2Ulv-Yseevvzj_yhKP1n12vIXlVE0HRBYqlOIHfeIKpJ7ebQAzyBlDUwZs',
  'scope': 'https://www.googleapis.com/auth/drive.metadata.readonly',
  'token_type': 'Bearer',
  'expiry_date': 1625028370828
}
// export let credentials = {
//   'access_token': 'ya29.GlsnBWfIXmvIl75K7Dr9TksiuAuCQCiFOAeEwEJot2jeY4pqUPoQZ0_0AJepiTAgVLhADUYrbaZwBGLrJiST3o5GpvQvjng2H0MTwSPB0OqSDAvJ547BFoez7WwO',
//   'refresh_token': '1/SyygmCShfUh_oWCXBifpCyJmaif2XTOolo9W5KOmkyQ9IROLUmxWB9NAxXKJv0Kt',
//   'token_type': 'Bearer',
//   'expiry_date': 1513659372927
// }

export let secrets = {
  'installed': {
    'client_id': '885665378430-99mb6j2hlqmmiv9iff59dto6212jtelf.apps.googleusercontent.com',
    'project_id': 'expanded-net-189111',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://accounts.google.com/o/oauth2/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_secret': 'Klp7igLTbjfPZWFZrnf3KznI',
    'redirect_uris': ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost']
  }
}

export default {
  credentials,
  secrets
}
