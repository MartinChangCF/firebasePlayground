import admin from 'firebase-admin'
import serviceAccount from './key/instaair-a188b-firebase-adminsdk-0rs2x-4f7f4cdee9.json'

// import axios from 'axios'
// import _ from 'lodash'

function initial () {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://instaair-a188b.firebaseio.com'
  })

  main()
}

function close (db) {
  db.goOffline()
  process.exit()
}

function objPrint (obj) {
  console.dir(obj, { depth: null })
}

async function main () {
  console.time('Main process')

  const db = admin.database()

  const obj = {
    1: {
      2: {
        3: {
          apple: 'pen'
        }
      }
    }
  }
  objPrint(obj)

  console.timeEnd('Main process')
  close(db)
}

initial()
