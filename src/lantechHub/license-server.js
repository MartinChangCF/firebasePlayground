const { transform } = require('lodash')
const { exec } = require('child_process')
const fRef = require('../firebaseRef')
// const fAdmin = require('firebase-admin')
// const schedule = require('node-schedule')

class LicenseWizard {
  constructor () {
    this.entries = {}
    this.cmd = './core2-fcl-generator'
    this.licenseFlag = {
      0: '-l3l', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3L
      1: '-l3', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3
      2: '-ttdp', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP
      3: '-rnat', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_RNAT
      4: '-multiECN' // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_MULTI_ECN
      // 5: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_TC
      // 6: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_BC
      // 7: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_OC
      // 8: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_GPTP
      // 9: Boolean // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_POWER
    }
  }

  async startFRDBConn (db) {
    if (!db) throw new Error('db is required.')

    /* ------------------------------- child_added ------------------------------ */
    db.ref('licenseRegistry/lantech_lantech').orderByChild('createdAt').limitToLast(1).on(
      'child_added',
      async (snapshot, prevChildKey) => {
        const consoleLable = `child_added: ${snapshot.key}`
        console.group(consoleLable)
        console.log(snapshot.val())

        const licId = snapshot.key
        const [mac, category, sn] = licId.split('-')

        const licData = snapshot.val()
        const { entry } = licData
        const flagList = transform(entry, (result, val, key) => {
          if (val) result.push(this.licenseFlag[key])
        }, [])
        const flagsStr = flagList.join(' ')
        const script = `${this.cmd} -mac=${mac.replace(':', '')} -serialno=${sn} -platform=${category} ${flagsStr}`

        const { error, stdout, stderr } = await exec(script)
        if (error) {
          console.log(`error: ${error.message}`)
          return
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)

        // const schedule = licData.schedule
        // licData.messages.forEach(x => {
        //   const cb = async () => {
        //     // ajax2ws(x.params.deviceId, {...x}, {...responser})
        //     await db.ref('licenseRegistry/lantech_lantech').child(licId).child('status').set('running')
        //     console.log('TRIGGERED', x.params.deviceId, { ...x }, { ...responser })
        //     await db.ref('licenseRegistry/lantech_lantech').child(licId).child('status').set('done')
        //     await db.ref('licenseRegistry/lantech_lantech').child(licId).remove().catch(err => console.error(err))
        //   }

        //   // has schedule and in the future
        //   db.ref('licenseRegistry/lantech_lantech').child(licId).child('status').set('ready')
        //   if (schedule && new Date().getTime() > schedule) {
        //     const cfg = new Date(x.schedule)
        //     this.set(licId + x.id, cfg, cb)
        //   } else {
        //     cb()
        //   }
        // })
        console.log()
        console.groupEnd()
      },
      (error) => {
        console.error('child_added', error)
        this.closeFRDBConn(db)
      })

    /* ------------------------------ child_removed ----------------------------- */
    db.ref('licenseRegistry/lantech_lantech').on(
      'child_removed',
      async (oldChildSnapshot) => {
        const consoleLable = `child_removed: ${oldChildSnapshot.key}`
        console.group(consoleLable)
        console.log(oldChildSnapshot.val())

        // const licId = oldChildSnapshot.key
        // const licData = oldChildSnapshot.val()
        // // if (licData.status == null || licData.status === 'ready') {
        // licData.messages.forEach(x => {
        //   this.cancel(licId + x.id)
        // })
        // // }
      },
      (error) => {
        console.error('child_removed', error)
        this.closeFRDBConn(db)
      })

    /* ------------------------------ child_changed ----------------------------- */
    db.ref('licenseRegistry/lantech_lantech').on(
      'child_changed',
      (childSnapshot, prevChildKey) => {
        const consoleLable = `child_changed: ${childSnapshot.key}`
        console.group(consoleLable)
        console.log(childSnapshot.val())

        // ajax2ws()

        console.groupEnd()
      },
      (error) => {
        console.error('child_changed', error)
        this.closeFRDBConn(db)
      })
  }

  closeFRDBConn (db) {
    db.off()

    console.log('LicenseWizard exits due to db closed.')
    process.exit()
  }
}

async function run () {
  const {
    db
  } = await fRef.init('admin', 'hub')
  const lw = new LicenseWizard()
  await lw.startFRDBConn(db)
}

run()
