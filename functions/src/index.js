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

/*
  For Postman developing trick,
  provide more info when using query:"?intrising=53116727" with url:"localhost" request
*/
function isFromIntrising ({ req, res }) {
  if (req.hostname === 'localhost') return true
  let hint = ''
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'anonymous'
  const hasKeyword = req.body.intrising === '53116727'
  hint = `Request from ${ip} is ${ip === intrisingIp ? '' : 'not '}from Intrising and has ${hasKeyword ? '' : 'no '}magic words.`
  console.log(hint)
  return (ip === intrisingIp) || hasKeyword
}

function errorHandler (https, error, psInfo) {
  console.log(psInfo == null ? '' : `[${psInfo}]` + ` ${error.name}: ${error.message}`)
  if (isFromIntrising(https)) {
    https.res.status(500).json({
      message: 'Failed',
      error: error.message
    })
  } else {
    https.res.status(500).json({
      message: 'Failed'
    })
  }
}

function successHandler (https, more) {
  if (isFromIntrising(https)) {
    https.res.status(200).json({
      ...more
    })
  } else {
    https.res.status(200).json({
      message: 'ok'
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
    result[`${custom}_${formattedVersion}_${model}_l2`] = l2Url
    result[`${custom}_${formattedVersion}_${model}_l3`] = l3Url
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
    if (l2Url == null && l3Url == null) {
      invalidModel.pool.push(`${custom}_${version}_${model}`)
    } else {
      result.push({
        category,
        model,
        l2: l2Url != null,
        l3: l3Url != null
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
      .catch((error) => errorHandler(https, error, ''))

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
        message: 'updated',
        warning: invalidModel.warning()
      })
    } else {
      successHandler(https, { message: 'updated' })
    }
  }
})
