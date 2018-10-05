import admin from 'firebase-admin'
import serviceAccount from './static/key/lantechhub-firebase-adminsdk-bqmj9-48f8f5cb02'
import production from './static/data/lantechProduction.json'

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

  await organizeData(db)
  await organizeFamily(db)

  console.timeEnd('Main process')
  close(db)
}

function close (db) {
  db.goOffline()
  process.exit()
}

// function objPrint (obj) {
//   console.dir(obj, { depth: null })
// }

async function organizeData (db) {
  const { attr, data } = production
  let p = {}
  for (let i in data) {
    let id = data[i][0]
    if (p[id] == null) p[id] = {}
    for (let j in data[i]) {
      let key = attr[j]
      p[id][key] = data[i][j]
    }
    p[id] = {
      ...p[id],
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    }
    console.log(p)
  }
  await db.ref('network/product').set(p)
}

async function organizeFamily (db) {
  const { data } = production
  const f = {}
  for (let i in data) {
    f[data[i][3]] = true
  }
  console.log(f)
  await db.ref('network/family').set(f)
}
