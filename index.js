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

  // await go20191112()
  await go20200112()

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

export async function upgradeLantechHub () {
  console.time('2019/11/12')
  console.group('2019/11/12')

  const {
    db
  } = await init('admin', 'lantechhub')
  await lantechHub.reconstruct(db)
  await lantechHub.clearPreviousHub(db)

  console.groupEnd()
  console.timeEnd('2019/11/12')
  close(db)
}

export async function go20191112 () {
  console.time('2019/11/12')
  console.group('2019/11/12')

  const {
    db
  } = await init('admin', 'testHub')
  await lantechHub.resetCurrDb(db)
  await lantechHub.reconstruct(db)
  await lantechHub.clearPreviousHub(db)

  console.groupEnd()
  console.timeEnd('2019/11/12')
  close(db)
}

export async function go20191121 () {
  console.time('2019/11/21')
  console.group('2019/11/21')

  const {
    db
  } = await init('admin', 'lantechhub')
  await lantechHub.createFwUniqKey(db)

  console.groupEnd()
  console.timeEnd('2019/11/21')
  close(db)
}

export async function go20200111 () {
  console.time('2020/01/11')
  console.group('2020/01/11')

  const {
    db
  } = await init('admin', 'lantechhub')

  const reqBody = [
    { vendor: 'lantech_lantech', category: 'wrouter' },
    { vendor: 'lantech_lantech', category: 'swix2' }
  ]

  const naturalSorting = (data, key, option = 'asc') => {
    return option === 'asc'
      ? data.slice().sort((a, b) => a[key].localeCompare(b[key], undefined, {
        numeric: true
      }))
      : data.slice().sort((a, b) => b[key].localeCompare(a[key], undefined, {
        numeric: true
      }))
  }

  for (const { vendor, category } of reqBody) {
    console.log(vendor, category)
    const fws = await db.ref('firmware').orderByChild('custom').equalTo(vendor).once('value').then(sn => sn.val())
    const result = naturalSorting(_.filter(fws, { category }), 'version', 'desc')
    console.log(result[0])
  }

  console.groupEnd()
  console.timeEnd('2020/01/11')
}

export async function go20200112 () {
  console.time('2020/01/12')
  console.group('2020/01/12')

  const {
    db
  } = await init('admin', 'intriot')

  const list = await db.ref('swix-config').orderByChild('macAddress').equalTo('E8:DE:D6:24:00:0B').once('value').then((sn) => sn.val())
  console.log(list)

  console.groupEnd()
  console.timeEnd('2020/01/12')
}
