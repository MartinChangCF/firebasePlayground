import admin from 'firebase-admin'

// import axios from 'axios'
import _ from 'lodash'

const config = {
  instaair: {
    credential: admin.credential.cert('./static/key/instaair-a188b-firebase-adminsdk-0rs2x-4f7f4cdee9.json'),
    databaseURL: 'https://instaair-a188b.firebaseio.com'
  },
  intrihub: {
    credential: admin.credential.cert('./static/key/intrihub-98da3-firebase-adminsdk-hctky-3f1b4b8830.json'),
    databaseURL: 'https://intrihub-98da3.firebaseio.com'
  },
  lantechhub: {
    credential: admin.credential.cert('./static/key/lantechhub-firebase-adminsdk-bqmj9-48f8f5cb02.json'),
    databaseURL: 'https://lantechhub.firebaseio.com'
  },
  intrinotify: {
    credential: admin.credential.cert('./static/key/intrinotify-firebase-adminsdk-lv8a8-e8a856ddbc.json'),
    databaseURL: 'https://intrinotify.firebaseio.com'
  }
}

init()

function init () {
  admin.initializeApp(config.lantechhub)
  const db = admin.database()
  main(db)
}

async function main (db) {
  console.time('Main process')

  await custom2Arr(db)

  console.timeEnd('Main process')
  close(db)
}

async function custom2Arr (db) {
  const ref = 'network/product'
  let dataset = {}
  await db.ref(ref).once('value').then((snapshot) => {
    const products = snapshot.val()
    for (let pKey in products) {
      const { custom } = products[pKey]
      dataset[pKey] = custom
    }
  })
  /* Transform custom to arr */
  for (let k in dataset) {
    await db.ref(`${ref}/${k}`).update({ custom: [dataset[k]] })
  }
  /* Handle custom-product binding */
}

function close (db) {
  db.goOffline()
  process.exit()
}
