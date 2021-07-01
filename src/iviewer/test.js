import fs from 'fs-extra'
import google from 'googleapis'
import GoogleAuth from 'google-auth-library'
import request from 'request'
import path from 'path'
import { credentials, secrets } from './client_secret.js'

function getAuthedClient () {
  let clientSecret = secrets.installed.client_secret
  let clientId = secrets.installed.client_id
  let redirectUrl = secrets.installed.redirect_uris[0]
  let auth = new GoogleAuth()
  let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)
  oauth2Client.credentials = credentials

  return oauth2Client
}

async function main() {
  console.log('***************************************************************@1')
  const googleClient = getAuthedClient()
  console.log('***************************************************************@2')
  const googleDriveFileInfo = await getFile(googleClient, "1Qr3h-zz5jK1VRnjZkcg2WGkiR0c8t_ew", "./")
  console.log('***************************************************************@3')
  // console.log('Google Drive :: downloaded a file=>', googleDriveFileInfo)
  const expectedMd5 = googleDriveFileInfo.md5Checksum
  console.log('***************************************************************@4')
  const fileName = googleDriveFileInfo.originalFilename
  console.log('***************************************************************@5')
  const filePath = googleDriveFileInfo.downloadedTo  // the property we added in getFile()
  console.log('***************************************************************@6')
  const fileMd5 = calculateFwFileMd5(fileName)
  console.log('****************************************************************')
  console.log(fileName, filePath)
  console.log('****************************************************************')
  console.log('       calculated:', fileMd5)
  console.log('  GDrive expected:', expectedMd5)
  console.log('IntriHub expected:', x.md5Checksum)

}

main()


// There is an issue when piping the file content from service.files.get(), it will
// return the credentials content
// ref: https://github.com/google/google-api-nodejs-client/issues/501
// ref: https://github.com/google/google-api-nodejs-client/issues/625
// Use v2 until it's solved, need to send 2 request, not the best , but solved issue for now.
// By Walter 20171219
export function getFile (auth, fileId, destFolder) {
  // let service = google.drive('v3')
  let service = google.drive('v2')
  return new Promise(function (resolve, reject) {
    // dest.on('finish', function () {
    //   console.log('download finish')
    // }).on('pipe', function (e) {
    //   console.log('start pipe')
    // }).on('close', function () {
    //   console.log('stream close')
    //   resolve()  // done
    // })
    // service.files.get({
    //   fileId: instaMark,
    //   alt: 'media',
    //   auth: auth
    // }).on('response',function (res) {
    //   console.log('got res', res.statusCode)
    //   console.log('got res data', res.data)
    // }).on('end', function () {
    //   console.log('end')
    // }).on('err', function (e) {
    //   reject(e) // error
    // }).pipe(dest)
    service.files.get({
      auth: auth,
      // fields: 'downloadUrl',
      fileId: fileId
    }, function (err, file) {
      console.log('***************************************************************@2.1')
      let requestSettings = {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + auth.credentials.access_token
        },
        encoding: null // Does not try to parse file contents as UTF-8
      }
      console.log('***************************************************************@2.2')
      // console.log('========================\nGoogle Drive getFile \n============================ ', file)
      if (err) {
        console.log('***************************************************************@2.3', err)
        console.log(auth)
        console.log(fileId)
        // return reject(err)
      }
      console.log('***************************************************************@2.4')
      // console.log(file)
      // let url = file.downloadUrl
      let url = "https://drive.google.com/uc?export=download&id=" + fileId
      if (!url) {
        return reject('No download url was returned by the Google Drive API')
      }
      console.log('***************************************************************@2.5')
      try {
        console.log('***************************************************************@2.6')
        fs.ensureDirSync(destFolder)
        const downloadedTo = path.join(destFolder, file.originalFilename)
        let dest = fs.createWriteStream(downloadedTo)
        file.downloadedTo = downloadedTo
        console.log('***************************************************************@2.7', file.downloadUrl)
        if (file.downloadUrl == null) {
          console.log('***************************************************************@2.7.1')
          file.downloadUrl = 'https://drive.google.com/uc?export=download&id=' + file.id
        }
        requestSettings.url = file.downloadUrl
        request(requestSettings, function (err, response, body) {
          if (err) {
            return reject(err)
          }
          // body is a buffer with the file's contents
          dest.write(body)
          dest.end(() => resolve(file))  // Resolve when writing ends...
        })
        console.log('***************************************************************@2.8')
      } catch (err) {
        console.log('***************************************************************@2.9')
        return reject(err)
      }
    })
  }) // end of the return promise
} // end of getFile(0)

