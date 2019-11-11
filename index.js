import * as lantechHub from './lib/lantechHub'
import {
  close,
  init
} from './lib/firebaseRef'
import { resolve } from 'path'

// import { close, init } from './lib'
// import axios from 'axios'
// import { writeFileSync } from 'fs'
import _ from 'lodash'

global.appRoot = resolve(__dirname)

main()

async function main () {
  console.group('Main Process')
  console.time('Main process')

  await go20191111()

  /*
  When handling firmware, there is a case needs to be aware of.
  They have a scenario that is below:
  A uses API create a firmware record with empty "feature", "bugfix"
  B uses UI to update "feature", "bugfix"
  A wants to update some of the props whcih cause the "feature", "bugfix" be erased.

  You can create a partial update when using API, only effect some column so that the others will be neglect.
  And UI can update the whole proprs...
  */

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

export async function go20191111 () {
  console.time('2019/11/10')
  console.group('2019/11/10')

  // const {
  //   db,
  //   uid
  // } = await init('app', 'testHub')

  // const { custom } = await db.ref('user').child(uid).once('value')
  //   .then((sn) => {
  //     return sn.val()
  //   })

  // console.log(custom)
  // // await db.ref('product').orderByChild(`custom/${custom}`).equalTo(custom).once('value')
  // await db.ref('firmware').orderByChild(`custom`).startAt(custom).once('value')
  //   .then((sn) => {
  //     const data = _.groupBy(sn.val(), 'custom')
  //     for (let k in data) {
  //       data[k] = data[k].length
  //     }
  //     console.log(data)
  //   })
  //   .catch((error) => {
  //     console.log(error)
  //   })

  const {
    db
  } = await init('admin', 'testHub')
  await lantechHub.resetCurrDb(db)
  await lantechHub.reconstruct(db)

  console.groupEnd()
  console.timeEnd('2019/11/10')
  close(db)
}
