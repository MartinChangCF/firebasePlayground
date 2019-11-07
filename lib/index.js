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
    const [acc, pwd] = config[project].app.account
    app.initializeApp(config[project].app.setting)
    if (acc == null || pwd == null) {
      console.error('Init app requires account, password.')
      return
    }
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
      credential: admin.credential.cert(`./static/key/${credential}`),
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
