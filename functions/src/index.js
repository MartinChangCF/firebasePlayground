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
  mibDownload: db.ref('mib/download')
}

function validateReq ({req, res}) {
  if (req.method !== 'POST') {
    res.status(400).json({
      message: 'Only POST.'
    })
    return false
  }
  return true
}

function validateBodyProps (https, schema) {
  const {
    req,
    res
  } = https
  const errors = schema.validate(req.body)
  if (errors.length) {
    let msg = {
      message: 'Invalid req.body props.'
    }
    if (isFromIntrising(https)) {
      msg = {
        ...msg,
        isFromIntrising: true,
        detail: schemas.show(errors)
      }
    }
    res.status(400).json(msg)
    return false
  } else {
    return true
  }
}

function isFromIntrising ({ req, res }) {
  console.group('Validate - Show request information')
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  console.log(`IP: ${ip}`)
  console.groupEnd()
  return ip === intrisingIp
}

function errorHandler (https, error) {
  console.log(error)
  if (isFromIntrising(https)) {
    https.res.status(500).json({
      message: 'Failed',
      error
    })
  } else {
    https.res.status(500).json({
      message: 'Failed'
    })
  }
}

exports.importPrivateMib = functions.https.onRequest(async (req, res) => {
  const https = {
    req,
    res
  }
  if (!validateReq(https)) return null
  if (!validateBodyProps(https, schemas.reqBody.mib)) return null

  /* Check if exists */
  const {
    version,
    custom,
    models,
    status,
    feature
  } = req.body

  const dupMibKey = dbRef.mibEntry
    .orderByChild('custom_version')
    .equalTo(`${custom}_${version}`)
    .once('value')
    .then((snapshot) => snapshot.key)
    .catch((error) => errorHandler(https, error))

  const mibUrls = transform(models, (result, value, key) => {
    const { model, layer2Url, layer3Url } = value
    result[`${custom}_${version}_${model}_l2`] = layer2Url
    result[`${custom}_${version}_${model}_l3`] = layer3Url
  }, {})

  const newModels = transform(models, (result, { category, model }, index) => {
    result.push({
      category,
      model
    })
  })

  if (dupMibKey != null) {
    await dbRef.mibEntry.child(dupMibKey)
      .update({
        updatedAt: dbTime,
        models: newModels,
        status,
        feature
      })
      .catch((error) => errorHandler(https, error))
    // Renew "dbRef.mibDownload", by creating a group update to handle adding for new and removing for old
    const mergedMibUrls = await dbRef.mibDownload
      .orderByKey()
      .startAt(`${custom}_${version}`)
      .once('value')
      .then((sn) => {
        const oldMibUrlsToNull = transform(keys(sn.val()), (result, value, index) => {
          result[value] = null
        }, {})
        return mergeWith(oldMibUrlsToNull, mibUrls, (x, y) => x || y)
      })
      .catch((error) => errorHandler(https, error))
    await dbRef.mibDownload.update(mergedMibUrls).catch((error) => errorHandler(https, error))
  } else {
    await dbRef.mibEntry
      .push({
        createdAt: dbTime,
        updatedAt: dbTime,
        models: newModels,
        status,
        feature
      })
      .catch((error) => errorHandler(https, error))
    await dbRef.mibDownload.update(mibUrls).catch((error) => errorHandler(https, error))
  }
  return res.status(200).json({ message: 'ok' })
})
