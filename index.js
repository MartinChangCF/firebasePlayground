import { close, init, logObj } from './lib'
// import lantechHub from './lib/lantechHub'
// import axios from 'axios'
// import { writeFileSync } from 'fs'
import _ from 'lodash'

main()

async function main () {
  console.time('Main process')

  await testPermission()

  // await lantechHub.go20191107()

  console.timeEnd('Main process')
}

/* LantechHub reconstruct functions */

async function testPermission () {
  console.time('Test Permission')
  console.group('Test Permission')

  const { db, uid } = await init('app', 'testHub')
  tests: { // eslint-disable-line
    const { custom: targetCustom = null } = await db.ref('user').child(uid).once('value')
      .then((sn) => {
        return sn.val()
      })
      .catch((error) => {
        console.group(`Get ${uid} info error`)
        console.log(error.code)
        console.groupEnd()
        return {}
      })
    if (targetCustom == null) {
      break tests // eslint-disable-line
    }
    const prodList = await db.ref('product').orderByChild(`custom/${targetCustom}`).equalTo(true).once('value')
      .then((sn) => {
        const prodList = sn.val()
        console.log(prodList)
        return prodList
      })
      .catch((error) => {
        console.group(`Get ${targetCustom} error`)
        console.log(error.code)
        console.groupEnd()
        return null
      })
    if (prodList == null) {
      break tests // eslint-disable-line
    }
    console.group(`Get ${targetCustom}:`)
    logObj(prodList)
    console.groupEnd()

    console.groupEnd()
  }

  close(db)
  console.groupEnd()
  console.timeEnd('Test Permission')
}
