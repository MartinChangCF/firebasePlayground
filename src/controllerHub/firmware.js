import _ from 'lodash'
import { init } from '../firebaseRef'
import { getFileIDFromGoogleDriveURL, logObj } from '../utility'
import { getFileInfo } from '../googleapis'

export async function updateNoneMd5ChecksumFw () {
  console.time('Update None MD5Checksum Firmware')
  console.group('Update None MD5Checksum Firmware')

  const { db } = await init('admin', 'controllerHub')
  const data = await findFwWithoutMd5Checksum(db)
  const dataArr = _.transform(data, (r, v, k) => { r.push({ ...v, key: k }) }, [])

  console.group('Targetted amounts group by category')
  const dataGroupByCategory = _.groupBy(dataArr, 'category')
  for (const k in dataGroupByCategory) {
    console.log(k, dataGroupByCategory[k].length)
  }
  if (!dataGroupByCategory.length) console.log('N/A')
  console.groupEnd()

  for (const i in dataArr) {
    const fileID = getFileIDFromGoogleDriveURL(dataArr[i].url)
    const { md5Checksum, originalFilename } = await getFileInfo(fileID).then(info => info.data).catch(err => { throw err })
    await db.ref('firmware/switch/storage').child(dataArr[i].key)
      .update({
        md5Checksum,
        originalFilename
      })
      .catch(err => console.log(dataArr[i], err))
  }

  db.goOffline()
  console.groupEnd()
  console.timeEnd('Update None MD5Checksum Firmware')
}

export async function findFwWithoutMd5Checksum (db) {
  const data = await db
    .ref('firmware/switch/storage')
    .orderByChild('md5Checksum')
    .equalTo(null)
    .once('value')
    .then((sn) => sn.val())
  return data
}

export async function migrateFw () {
  console.time('Migrate firmware from Hub to ControllerHub')
  console.group('Migrate firmware from Hub to ControllerHub')

  const db = {
    hub: await init('admin', 'hub'),
    ctrlHub: await init('admin', 'controllerHub')
  }

  console.group('Get Hub firmware')
  const src = await getHubFw(db.hub)
  logObj(src)
  console.groupEnd()

  console.group('Add controllerHub firmware')
  await addCtrlHubFw(db.ctrlHub, src)
  console.groupEnd()

  console.groupEnd()
  console.timeEnd('Migrate firmware from Hub to ControllerHub')

  db.hub.goOffline()
  db.ctrlHub.goOffline()
}

export async function getHubFw (db) {
  const val = await db.ref('firmware/storage').orderByChild('category').equalTo('').once('value').then((sn) => sn.val())
  return val
}

export async function addCtrlHubFw (db, val) {
  const ref = await db.ref('firmware/storage').child('a')
  return ref.set(val)
}
