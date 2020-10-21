import { init } from './auth'
const { google } = require('googleapis')

export async function getFileInfo (fileId, fields = ['md5Checksum', 'originalFilename']) {
  const auth = await init()
  const drive = google.drive({ version: 'v3', auth })
  return new Promise((resolve, reject) => {
    drive.files.get({
      fileId,
      fields: fields.join(',')
    }, function (error, file) {
      if (error) {
        reject(error)
      } else {
        resolve(file)
      }
    })
  })
}
