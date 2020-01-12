import * as functions from 'firebase-functions'
import admin from 'firebase-admin'
import { keys, mergeWith, transform } from 'lodash'
import { schemas } from './lib.js'

admin.initializeApp()

const intrisingIp = '220.133.106.153'
const db = admin.database()
const dbTime = admin.database.ServerValue.TIMESTAMP
const dbRef = {
  mibEntry: db.ref('mib/entry'),
  mibDownload: db.ref('mib/download'),
  fw: db.ref('firmware')
}

function validateReq ({ req, res }) {
  if (req.method !== 'POST') {
    res.status(400).json({
      message: 'only POST'
    })
    return false
  }
  return true
}

/*
  For security issue, check IP first and if outside Intrising, use Basic Authentication to varify access permission.
    - Basic aW50cmlzaW5nOjUzMTE2NzI3Cg
  And for develop, using localhost is ok.
*/
function validatePermission ({ req, res }) {
  const ip = req.get('X-Forwarded-For') || req.connection.remoteAddress || 'anonymous'
  const ipOk = ip === intrisingIp
  const auth = req.get('Authorization')
  const authOk = auth === 'Basic aW50cmlzaW5nOjUzMTE2NzI3' // intrising:53116727 in base64
  const fcfLog = `Request permission check: ${ipOk || authOk ? 'passed' : 'failed'} (IP is ${ipOk ? 'correct' : ip} and basic auth ${auth} is ${authOk ? 'correct' : 'incorrect'})`
  console.log(fcfLog)
  if (ipOk || authOk) {
    return true
  } else {
    res.status(401).json({
      message: 'permsission denied'
    })
    return false
  }
}

function validateBodyProps (https, schema) {
  const {
    req,
    res
  } = https
  const errors = schema.validate(req.body)
  if (errors.length) {
    const msg = {
      message: 'invalid req.body props',
      detail: schemas.show(errors)
    }
    res.status(400).json(msg)
    return false
  } else {
    return true
  }
}

function errorHandler (https, error, fname = '') {
  console.log(fname === '' ? '' : `[${fname}] ` + `${error.name}: ${error.message}`)
  https.res.status(500).json({
    message: 'failed',
    error: error.message
  })
}

function successHandler (https, msg = { message: 'ok' }) {
  https.res.status(200).json(msg)
}

exports.importPrivateMib = functions.https.onRequest(async (req, res) => {
  const https = {
    req,
    res
  }

  if (!validatePermission(https)) return null
  if (!validateReq(https)) return null
  if (!validateBodyProps(https, schemas.reqBody.mib)) return null

  /* Check if exists */
  const {
    version,
    custom,
    models,
    status,
    feature = ''
  } = req.body

  /* Due to the fdb key can't contain '.', only value can */
  const formattedVersion = version.split('.').join('!')

  const dupMibKey = await dbRef.mibEntry
    .orderByChild('customVersion')
    .equalTo(`${custom}_${version}`)
    .once('value')
    .then((snapshot) => {
      return keys(snapshot.val())[0]
    })
    .catch((error) => errorHandler(https, error))

  const mibUrls = transform(models, (result, { l2Url = null, l3Url = null, model }, key) => {
    result[`${custom}_${formattedVersion}_${model}_l2`] = l2Url === '' ? null : l2Url
    result[`${custom}_${formattedVersion}_${model}_l3`] = l3Url === '' ? null : l3Url
  }, {})

  const invalidModel = {
    pool: [],
    warning: () => {
      return {
        title: 'Require at least one download link for a model entry or will be ignored.',
        ignoredCount: invalidModel.pool.length,
        ignored: invalidModel.pool
      }
    }
  }
  const newModels = transform(models, (result, { category, l2Url = null, l3Url = null, model }, index) => {
    /* Skip both null situ and res with warning */
    if ((l2Url == null && l3Url == null) || (l2Url === '' && l3Url === '')) {
      invalidModel.pool.push(`${custom}_${version}_${model}`)
    } else {
      result.push({
        category,
        model,
        l2: l2Url != null && l2Url !== '',
        l3: l3Url != null && l3Url !== ''
      })
    }
  })

  if (dupMibKey != null) {
    await dbRef.mibEntry.child(dupMibKey)
      .update({
        updatedAt: dbTime,
        models: newModels,
        custom,
        customVersion: `${custom}_${version}`,
        status,
        feature
      })
      .catch((error) => errorHandler(https, error))

    // Renew "dbRef.mibDownload", by creating a group update to handle adding for new and removing for old
    const mergedMibUrls = await dbRef.mibDownload
      .orderByKey()
      .startAt(`${custom}_${formattedVersion}`)
      .once('value')
      .then((sn) => {
        const oldMibUrlsToNull = transform(keys(sn.val()), (result, value, index) => {
          result[value] = null
        }, {})
        return mergeWith(oldMibUrlsToNull, mibUrls, (x, y) => x || y)
      })
      .catch((error) => errorHandler(https, error))
    await dbRef.mibDownload.update(mergedMibUrls).catch((error) => errorHandler(https, error))

    /* Check if there are invalid model entry */
    if (invalidModel.pool.length) {
      successHandler(https, {
        message: 'updated',
        warning: invalidModel.warning()
      })
    } else {
      successHandler(https, { message: 'updated' })
    }
  } else {
    await dbRef.mibEntry
      .push({
        createdAt: dbTime,
        updatedAt: dbTime,
        version,
        models: newModels,
        custom,
        customVersion: `${custom}_${version}`,
        status,
        feature
      })
      .catch((error) => errorHandler(https, error))
    await dbRef.mibDownload.update(mibUrls).catch((error) => errorHandler(https, error))

    /* Check if there are invalid model entry */
    if (invalidModel.pool.length) {
      successHandler(https, {
        message: 'created',
        warning: invalidModel.warning()
      })
    } else {
      successHandler(https, { message: 'created' })
    }
  }
})

exports.importFirmware = functions.https.onRequest(async (req, res) => {
  const https = {
    req,
    res
  }

  if (!validatePermission(https)) return null
  if (!validateReq(https)) return null
  if (!validateBodyProps(https, schemas.reqBody.firmware)) return null

  const {
    bugFixed = '',
    category,
    custom,
    feature = '',
    firmwareLayer = 2,  // not required, but if properly provided in request then must be in [2, 3].
    md5,
    modelTxt = '',
    status,
    testReportUrl = '',
    url,
    version
  } = req.body

  const fwUniqKey = `${custom}_${category}_${version}`

  const dupFwKey = await dbRef.fw
    .orderByChild('customCategoryVersion')
    .equalTo(fwUniqKey)
    .once('value')
    .then((snapshot) => {
      return keys(snapshot.val())[0]
    })
    .catch((error) => errorHandler(https, error))

  if (dupFwKey != null) {
    await dbRef.fw.child(dupFwKey)
      .update({
        updatedAt: dbTime,
        url,
        md5
      })
      .catch((error) => errorHandler(https, error, ''))
    successHandler(https, { message: 'updated' })
  } else {
    await dbRef.fw
      .push({
        customCategoryVersion: fwUniqKey,
        bugFixed,
        createdAt: dbTime,
        category,
        custom,
        feature,
        firmwareLayer: ['router', 'routerx'].includes(category) ? firmwareLayer : null, // only these two categories require fwLayer
        md5,
        modelTxt,
        status,
        testReportUrl,
        updatedAt: dbTime,
        url,
        version
      })
      .catch((error) => errorHandler(https, error))
    successHandler(https, { message: 'created' })
  }
})

exports.getProductModel = functions.https.onRequest(async (req, res) => {
  const https = {
    req,
    res
  }

  if (!validatePermission(https)) return null
  if (!validateReq(https)) return null
  if (!validateBodyProps(https, schemas.reqBody.getProductModel)) return null

  const { category } = req.body

  const ref = 'product'
  const products = {}
  for (const x of category) {
    products[x] = await admin.database()
      .ref(ref)
      .orderByChild('category')
      .equalTo(x)
      .once('value')
      .then((snapshot) => {
        return transform(snapshot.val(), (result, val, key) => {
          if (val.status === 'release') {
            result.push(key)
          }
        }, [])
      })
      .catch(error => errorHandler(https, error))
  }

  successHandler(https, products)
})

/*
  getLatestFirmware:
  1. get firmware by custom(vendor) then filter by category
  2. if ip from intrising then use develop, else then use only release
*/
exports.getLatestFirmware = functions.https.onRequest((req, res) => {
  const https = {
    req,
    res
  }

  if (!validatePermission(https)) return null
  if (!validateReq(https)) return null
  if (!validateBodyProps(https, schemas.reqBody.getLatestFirmware)) return null


  

  /* serilnumber */
  // const vendors = JSON.parse(req.body.vendors)
  let conditions = req.body
  const ref = '/firmware/switch/storage'
  console.log({ conditions })
  if (!conditions) {
    return res.status(400).send('conditions is required.')
  } else {
    return admin.database()
      .ref(ref)
      .once('value')
      .then((snapshot) => {
        if (!snapshot.exists()) {
          throw String('no fm matched')
        } else {
          const swf = snapshot.val()
          conditions = handledConditions(conditions, swf)
          const requiredFm = _.transform(conditions, (result, condition, index) => {
            const { vendor, category } = condition
            const latest = naturalSorting(
              _.filter(swf, { custom: vendor, category, status: 'release' }),
              'version',
              'desc'
            )[0]
            const { version = null, createdAt = null, url = null, md5Checksum, originalFilename } = latest || {}
            result.push({
              ...condition,
              downloadLink: url,
              latestVersion: version,
              md5Checksum,
              originalFilename,
              createdAt
            })
          }, [])
          res.json(requiredFm)
        }
      })
      .catch(e => {
        console.log(e)
        res.status(400).send(e)
      })
  }
})