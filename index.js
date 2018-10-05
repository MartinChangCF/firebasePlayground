import admin from 'firebase-admin'
import serviceAccount from './static/key/intrinotify-firebase-adminsdk-lv8a8-e8a856ddbc'

// import axios from 'axios'
import _ from 'lodash'

const config = {
  instaair: {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://instaair-a188b.firebaseio.com'
  },
  intrihub: {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://intrihub-98da3.firebaseio.com'
  },
  lantechhub: {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lantechhub.firebaseio.com'
  },
  intrinotify: {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://intrinotify.firebaseio.com'
  }
}

init()

function init () {
  admin.initializeApp(config.intrinotify)
  const db = admin.database()
  main(db)
}

async function main (db) {
  console.time('Main process')

  await db.ref('services').once('value').then(async (snapshot) => {
    const sv = snapshot.val()
    for (let key in sv) {
      const { time } = sv[key]
      if (typeof time === 'string') {
        console.log(key, typeof time, time, getTime(time))
        await db.ref('services').child(key).update({
          time: getTime(time)
        })
      }
    }
  })

  console.timeEnd('Main process')
  close(db)
}

function close (db) {
  db.goOffline()
  process.exit()
}

function getTime (t) {
  return (new Date(t)).getTime()
}
