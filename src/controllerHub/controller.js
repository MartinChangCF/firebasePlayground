import _ from 'lodash'
import { init } from '../firebaseRef'
import { logObj } from '../utility'

const ref = {
  fw: 'firmware/pi/storage',
  reg: 'smart-controller/registeration'
}

export async function updateAvMediaToAspeedFw () {
  console.time('Update Av Media To Aspeed Fw')
  console.group('Update Av Media To Aspeed Fw')

  const { db } = await init('admin', 'controllerHub')
  const originalAvMedia = 'av_media'
  const newAvMedia = 'avmedia'
  let targets = {}

  const registration = await db.ref(ref.reg).orderByChild('model').equalTo(originalAvMedia).once('value').then(sn => sn.val()).catch(err => { throw err })
  // logObj(registration)
  targets = _.transform(registration, (r, v, k) => {
    r[`${ref.reg}/${k}/domain`] = newAvMedia
    r[`${ref.reg}/${k}/model`] = 'aspeed'
  }, targets)

  const fw = await db.ref(ref.fw).orderByChild('model').equalTo(originalAvMedia).once('value').then(sn => sn.val()).catch(err => { throw err })
  // logObj(fw)
  targets = _.transform(fw, (r, v, k) => {
    // rename
    if (/^scavV/g.test(v.version)) {
      const newVer = v.version.replace('scavV', 'scaV')
      r[`${ref.fw}/${k}/version`] = newVer
    }
    r[`${ref.fw}/${k}/domain`] = newAvMedia
    r[`${ref.fw}/${k}/model`] = 'aspeed'
  }, targets)
  logObj(targets)

  // await db.ref().update(targets)

  console.groupEnd()
  console.timeEnd('Update Av Media To Aspeed Fw')
}
