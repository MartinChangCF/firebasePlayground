/* global appRoot */
import config from '../static/key'
import admin from 'firebase-admin'
import app from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'

export function close (db) {
  db.goOffline()
  process.exit()
}

export function dbTime () {
  return admin.database.ServerValue.TIMESTAMP
}

export async function init (type, project) {
  let db = null
  let uid = null
  if (type === 'app') {
    const { account, setting } = config[project].app
    const [acc, pwd] = account
    if (setting == null || acc == null || pwd == null) {
      console.error('Init app requires setting, account, and password.')
      return
    }
    app.initializeApp(config[project].app.setting)
    await app.auth().signInWithEmailAndPassword(acc, pwd)
      .then((credential) => {
        uid = credential.user.uid
        console.log(`Signed in with email & pwd of ${uid}`)
        db = app.database()
      })
      .catch((err) => {
        console.group('Failed to sign in with email&psd')
        console.log(err)
        console.groupEnd()
        process.exit()
      })
    return {
      db,
      uid
    }
  } else {
    const {
      credential,
      databaseURL
    } = config[project].admin
    admin.initializeApp({
      credential: admin.credential.cert(`${appRoot}/static/key/${credential}`),
      databaseURL
    })
    return {
      db: admin.database()
    }
  }
}

export function logObj (obj) {
  console.log(JSON.stringify(obj, null, 4))
}
