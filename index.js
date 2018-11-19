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

  // await transformOldPmib(db)
  // await syncCategoryAndGenMmsCid(db)
  // await cleanUselessMib(db)
  // await db.ref('privateMibNotMapping2Product').once('value').then((snapshot) => {
  //   const s = snapshot.val()
  //   return db.ref('privateMIB').set(s)
  // })

  console.timeEnd('Main process')
  close(db)
}

async function transformOldPmib (db) {
  console.time('transformOldPmib')
  const mibs = await db.ref('private-mib').once('value').then((snapshot) => {
    const [{applyTo: mibs, bugFixed, createdAt, custom, feature, status, supportFwVersion, version}] = _.values(snapshot.val())
    // console.log(mibs)
    for (let model in mibs) {
      const url = mibs[model]
      mibs[model] = {
        bugFixed, category: 'swix1', createdAt, updatedAt: createdAt, custom, feature, status, supportFwVersion, version, url
      }
      console.count()
    }
    return mibs
  })
  await db.ref('privateMIB').set(mibs)
  console.timeEnd()
}

async function syncCategoryAndGenMmsCid (db) {
  console.time('syncCategoryAndGenMmsCid')
  const products = await db.ref('network/product').once('value').then((snapshot) => {
    return snapshot.val()
  })

  for (let pk in products) {
    const p = products[pk]
    const table = {
      Switch1: 'swix1',
      Switch2: 'swix2',
      Wireless: 'wrouter',
      Router: 'router',
      'Router X': 'routerx'
    }
    const newP = { custom: p.custom.toLowerCase() }
    if (table[p.category] != null) newP.category = table[p.category]
    if (p.category === 'swix1') {
      newP.mmsCID = ['5400', '5424', '6300'].includes(p.family)
        ? 'https://drive.google.com/open?id=0ByPOatSTzklcdnlzd01JT0tGNVU'
        : 'https://drive.google.com/open?id=0ByPOatSTzklcMXk0enlwX00wclk'
      console.log(newP)
    }
    await db.ref('network/product').child(pk).update(newP)
  }
  console.timeEnd()
}

async function cleanUselessMib (db) {
  const productKeys = await db.ref('network/product').once('value').then((snaphost) => {
    return _.keys(snaphost.val())
  })
  // console.log(productKeys)
  const dataset = await db.ref('privateMIB').once('value').then((snapshot) => {
    return _.transform(snapshot.val(), (remove, mib, key) => {
      const notExisted = _.indexOf(productKeys, key) === -1
      if (notExisted) {
        remove.push({ key, ...mib })
      } else console.log(key)
    }, [])
  })
  // console.log(dataset)
  for (let mib of dataset) {
    await db.ref('privateMibNotMapping2Product').child(mib.key).set(mib)
    await db.ref('privateMIB').child(mib.key).remove()
  }
}

function close (db) {
  db.goOffline()
  process.exit()
}
