const { transform } = require('lodash')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fRef = require('../firebaseRef')
const path = require('path')
// const fAdmin = require('firebase-admin')
// const schedule = require('node-schedule')

class LicenseWizard {
  constructor() {
    this.entries = {}
    this.cmd = path.resolve(__dirname, 'core2-fcl-generator')
    this.licenseFlag = {
      0: '-l3l', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3L
      1: '-l3', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3
      2: '-ttdp', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP
      3: '-rnat', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_RNAT
      4: '-multiECN', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_MULTI_ECN
      5: '-iec4dash2' // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_IEC62443_4_2
      // 6: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_TC
      // 7: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_BC
      // 8: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_OC
      // 9: Boolean, // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_GPTP
      // 10: Boolean // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_POWER
    }
    this.categoryMap = {
      router: 'OS3',
      routerx: 'OS4'
    }
    this.licenseMap = {
      0: 'L3L', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3L
      1: 'L3', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_L3
      2: 'TTDP', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP
      3: 'TTDP_RNAT', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_RNAT
      4: 'TTDP_MULTI_ECN', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_TTDP_MULTI_ECN
      5: 'IEC62443_4_2', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_IEC62443_4_2
      // 6: 'PTP_TC', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_TC
      // 7: 'PTP_BC', // LTLicenseKeyypeOptions_LT_LICENSE_KEY_TYPE_PTP_BC
      // 8: 'PTP_OC', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_OC
      // 9: 'PTP_GPTP', // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_GPTP
      // 10: 'PTP_POWER' // LTLicenseKeyTypeOptions_LT_LICENSE_KEY_TYPE_PTP_POWER
    }
  }

  async startFRDBConn(db, stobkt) {
    if (!db) throw new Error('db is required.')
    if (!stobkt) throw new Error('stobkt is required.')

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

        const licenseStr = await this.generateLicenseStr(licId, entry, stobkt)
        console.log(licenseStr)
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
        const licenseStr = await this.generateLicenseStr(licId, entry, stobkt)
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

  // console.log(stobkt)
  async generateLicenseStr(licId, licEntry, stobkt) {
    const [mac, category, sn] = licId.split('_')
    const licStr = transform(licEntry, (result, k, v) => {
      if (v) {
        result.push(this.licenseMap[k])
      }
    }, []).join('_')
    const filename = [
      mac.replace(/:/g, ''),
      sn,
      this.categoryMap[category] || '',
      licStr
    ].filter(x => x !== '').join('_') + '.LCNS'
    const filepath = path.resolve(__dirname, filename)
    const flagList = transform(licEntry, (result, val, key) => {
      if (val) result.push(this.licenseFlag[key])
    }, [])
    const flagsStr = flagList.join('=true ')
    const script = `${this.cmd} -mac=${mac.replace(/:/g, '')} -serialno=${sn} -platform=${category} ${flagsStr} -filePath=${filepath}`
    console.log(script)

    const { error, stdout, stderr } = await exec(script)
    if (error) {
      console.log(`error: ${error.message}`)
      return ''
    }

    /* Martin: the output is stderr which is strange... */
    // if (stderr) {
    //   console.log('stderr', stderr)
    //   return ''
    // }

    // check script output
    // if (!stdout.toString().includes(`fcl.go:50: write : path is  ${filepath}`)) {
    //   // there are expected output and have filename in the last line
    //   /* 
    //     main_generator.go:24: Version :  0.0.13
    //     main_generator.go:38: platform = xcat3
    //     main_generator.go:39: filePath = 123.LCNS
    //     main_generator.go:40: macPtr =  286046FFFFF1
    //     main_generator.go:41: serialNoPtr =  00000000000000001
    //     main_generator.go:42: l3l = true
    //     main_generator.go:43: l3 =  true
    //     main_generator.go:44: ttdp =  true
    //     main_generator.go:45: ttdpRNAT =  true
    //     main_generator.go:46: ttdpMultiECN =  true
    //     check_export.go:58: ValidateInputMACAndSN :  286046FFFFF1 00000000000000001
    //     generator.go:49: outputResult.Content.IDLists =  [{28:60:46:ff:ff:f1 00000000000000001}]
    //     fcl.go:50: write : path is  123.LCNS
    //   */
    //   return ''
    // }

    // upload to firebase storage
    await stobkt.upload(filepath)
      .then(filemeta => console.log(filemeta))
      .catch(err => console.log(err))

    // rm local file
    await exec(`rm ${filepath}`)

    return filename
  }

  closeFRDBConn(db) {
    db.off()

    console.log('LicenseWizard exits due to db closed.')
    process.exit()
  }
}

async function run() {
  const {
    db,
    stobkt
  } = await fRef.init('admin', 'hub')
  const lw = new LicenseWizard()
  await lw.startFRDBConn(db, stobkt)
  console.log('licenst server start')
}

run()
