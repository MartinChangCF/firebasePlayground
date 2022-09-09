const { transform } = require('lodash')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fRef = require('../firebaseRef')
const path = require('path')
// const fAdmin = require('firebase-admin')
// const schedule = require('node-schedule')

class LicenseWizard {
  constructor () {
    this.entries = {}
    this.cmd = path.resolve(__dirname, 'core2-fcl-generator')
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
    db.ref('licenseRegistry/lantech_lantech').orderByChild('createdAt').limitToLast(10).on(
      'child_added',
      async (snapshot, prevChildKey) => {
        const consoleLable = `child_added: ${snapshot.key}`
        console.group(consoleLable)
        console.log(snapshot.val())

        const licId = snapshot.key
        const { entry, license } = snapshot.val()

        if (license != null) {
          console.log('license exists. Skipped.')
          console.groupEnd()
          return
        }

        const licenseStr = await this.generateLicenseStr(licId, entry)
        if (licenseStr == '') {
          console.error('failed to generate licenseStr')
          console.groupEnd()
          return
        }

        await db.ref('licenseRegistry/lantech_lantech').child(licId).child('license').set({
          generatedAt: fRef.dbTime(),
          licenseStr
        })
        console.log('license is generated')
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
      async (childSnapshot, prevChildKey) => {
        const consoleLable = `child_changed: ${childSnapshot.key}`
        console.group(consoleLable)

        const licId = childSnapshot.key
        const { entry, license } = childSnapshot.val()
        if (license != null) {
          console.log('license exists. Skipped.')
          console.groupEnd()
          return
        }
        const licenseStr = await this.generateLicenseStr(licId, entry)
        if (licenseStr == '') {
          console.error('failed to generate licenseStr')
          console.groupEnd()
          return
        }

        await db.ref('licenseRegistry/lantech_lantech').child(licId).child('license').set({
          generatedAt: fRef.dbTime(),
          licenseStr
        })
        console.log('license is re-generated')
        console.groupEnd()

        // ajax2ws()

        console.groupEnd()
      },
      (error) => {
        console.error('child_changed', error)
        this.closeFRDBConn(db)
      })
  }

  async generateLicenseStr (licId, licEntry) {
    const [mac, category, sn] = licId.split('_')
    const flagList = transform(licEntry, (result, val, key) => {
      if (val) result.push(this.licenseFlag[key])
    }, [])
    const flagsStr = flagList.join(' ')
    const script = `${this.cmd} -mac=${mac.replace(/:/g, '')} -serialno=${sn} -platform=${category} ${flagsStr}`
    console.log(script)

    const { error, stdout, stderr } = await exec(script)
    if (error) {
      console.log(`error: ${error.message}`)
      return ''
    }
    if (stderr) {
      console.log('stderr', stderr)
      return ''
    }
    return stdout.toString()
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
