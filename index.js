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
  await go20200113()

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

export async function go20200113 () {
  console.time('2020/01/13')
  console.group('2020/01/13')

  const {
    db
  } = await init('admin', 'lantechhub')

  const nullFw = await db.ref('firmware').orderByChild('customCategoryVersion').equalTo(null).once('value').then((sn) => sn.val())
  console.log(nullFw)

  /* find dup version */
  // const g = _.groupBy(nullFw, 'customCategoryVersion')
  // const tabl = _.transform(g, (result, value, key) => {
  //   if (value.length > 1) {
  //     result[key] = value.length
  //   }
  // }, {})
  // console.log(tabl)

  /* update null fw */
  // for (const k in nullFw) {
  //   const { category, custom, version } = nullFw[k]
  //   await db.ref('firmware').child(k).child('customCategoryVersion').set(`${custom}_${category}_${version}`)
  // }

  console.groupEnd()
  console.timeEnd('2020/01/13')
}

export async function go20200116 () {
  console.time('2020/01/16')
  console.group('2020/01/16')

  const {
    db
  } = await init('admin', 'lantechhub')

  /* add authorization key on "product", "firmware", "mib/entry" */
  const updateTargets = {}
  const fw = await db.ref('firmware').orderByChild('customStatus').equalTo(null).once('value').then((sn) => sn.val())
  for (const k in fw) {
    const { custom, status } = fw[k]
    const warningTxt = `Firmware ${k} lost status key.`
    if (custom == null) {
      console.log(warningTxt)
      continue
    } else if (status == null) {
      console.log(warningTxt)
      continue
    } else {
      updateTargets[`firmware/${k}/customStatus`] = `${custom}_${status}`
    }
  }
  const mibEntry = await db.ref('mib/entry').orderByChild('customStatus').equalTo(null).once('value').then((sn) => sn.val())
  for (const k in mibEntry) {
    const {
      custom,
      status
    } = mibEntry[k]
    const warningTxt = `MIB Entry ${k} lost status key.`
    if (custom == null) {
      console.log(warningTxt)
      continue
    } else if (status == null) {
      console.log(warningTxt)
      continue
    } else {
      updateTargets[`mib/entry/${k}/customStatus`] = `${custom}_${status}`
    }
  }
  const prod = await db.ref('product').orderByChild('customStatus').equalTo(null).once('value').then((sn) => sn.val())
  for (const k in prod) {
    const {
      custom,
      status
    } = prod[k]
    const warningTxt = `Product ${k} lost status key.`
    if (custom == null) {
      console.log(warningTxt)
      continue
    } else if (status == null) {
      console.log(warningTxt)
      continue
    } else {
      for (const kk in custom) {
        updateTargets[`product/${k}/customStatus`] = `${custom}_${status}`
      }
    }
  }

  console.log(updateTargets)

  console.groupEnd()
  console.timeEnd('2020/01/16')
}
