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

  const newUsers = [
    { email: 'kenlee@intrising.com.tw' },
    { email: 'khkh@intrising.com.tw' },
    { email: 'brianlian@intrising.com.tw' },
    { email: 'jerry@intrising.com.tw' }
  ]
  await importUsers(db, newUsers)

  console.timeEnd('Main process')
  close(db)
}

function close (db) {
  db.goOffline()
  process.exit()
}

async function importUsers (db, newUsers) {
  console.group('Start importing users')
  for (let { email, password } of newUsers) {
    console.group(`Handling account: ${email}`)
    const uid = await signUp(email, password)
    if (uid == null) {
      console.groupEnd()
      console.log('Error occurred')
      continue
    }
    await db.ref('user').child(uid).set({
      email,
      role: 'admin',
      custom: 'all'
    })
    console.log('- User info is set up.')
    console.groupEnd()
  }
  console.groupEnd()
}

function signUp (email, password = '53116727') {
  return admin.auth().createUser({
    email,
    emailVerified: false,
    password
  })
    .then(function (userRecord) {
    // See the UserRecord reference doc for the contents of userRecord.
      console.log('- Successfully created new user.')
      return userRecord.uid
    })
    .catch(function (error) {
      const { code, message } = error
      if (code === 'auth/email-already-exists') {
        console.log('(Account existed.)')
        return admin.auth().getUserByEmail(email)
          .then(function (userRecord) {
            const userData = userRecord.toJSON()
            // console.log(userData)
            return userData.uid
          })
      } else {
        console.group('(X)Error creating new user')
        console.log('- Code: ', code)
        console.log('- Message: ', message)
        console.groupEnd()
        return null
      }
    })
}
