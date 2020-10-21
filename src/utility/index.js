import path from 'path'
import { promises as fs } from 'fs'
const googlgeDriveFileIdRegExp = /(?:(https:\/\/drive\.google\.com\/open\?id=)|(https:\/\/drive\.google\.com\/uc\?export\=download\&id\=)|(https:\/\/drive\.google\.com\/file\/d\/))([\w-_]+)(?:\/view)*(?:\?usp=sharing)*/g

export function logObj (obj) {
  console.log(JSON.stringify(obj, null, 4))
}

export async function saveToFile (data, type = '', name = '_tempOutputs') {
  await fs.writeFile(path.join(__dirname, `../static/output/${name}${type === '' ? '' : '.' + type}`), data)
}

export function getFileIDFromGoogleDriveURL (url) {
  let id = null
  // https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
  for (const r of url.matchAll(googlgeDriveFileIdRegExp)) {
    id = r[4]
  }
  return id
}
