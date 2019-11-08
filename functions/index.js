"use strict";

var _firebaseFunctions = _interopRequireDefault(require("firebase-functions"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

var _lodash = require("lodash");

var _lib = require("./lib.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const intrisingIp = '220.133.106.153';

const db = _firebaseAdmin.default.database();

const dbTime = _firebaseAdmin.default.database.ServerValue.TIMESTAMP;
const dbRef = {
  mibEntry: db.ref('mib/entry'),
  mibDownload: db.ref('mib/download')
};

function validateReq({
  req,
  res
}) {
  if (req.method !== 'POST') {
    return res.status(400).json({
      message: 'Only POST.'
    });
  }

  return null;
}

function validateBodyProps(https, schema) {
  const {
    req,
    res
  } = https;
  const errors = schema.validate(req.body);

  if (errors.length) {
    let msg = {
      message: 'Invalid req.body props.'
    };

    if (isFromIntrising()) {
      msg = { ...msg,
        isFromIntrising: true,
        detail: _lib.schemas.show(errors)
      };
    }

    return res.status(400).json(msg);
  } else {
    return null;
  }
}

function isFromIntrising({
  req,
  res
}) {
  console.group('Validate - Show request information');
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`IP: ${ip}`);
  console.groupEnd();
  return ip === intrisingIp;
}

function errorHandler(https, error) {
  console.log(error);

  if (isFromIntrising(https)) {
    https.res.status(500).json({
      message: 'Failed',
      error
    });
  } else {
    https.res.status(500).json({
      message: 'Failed'
    });
  }
}

exports.importPrivateMib = _firebaseFunctions.default.https.onRequest(async (req, res) => {
  const https = {
    req,
    res
  };
  validateReq(https);
  validateBodyProps(https, _lib.schemas.reqBody.mib);
  /* Check if exists */

  const {
    version,
    custom,
    models,
    status,
    feature
  } = req.body;
  const dupMibKey = dbRef.mibEntry.orderByChild('custom_version').equalTo(`${custom}_${version}`).once('value').then(snapshot => snapshot.key).catch(error => errorHandler(https, error));
  const mibUrls = (0, _lodash.transform)(models, (result, value, key) => {
    const {
      model,
      layer2Url,
      layer3Url
    } = value;
    result[`${custom}_${version}_${model}_l2`] = layer2Url;
    result[`${custom}_${version}_${model}_l3`] = layer3Url;
  }, {});
  const newModels = (0, _lodash.transform)(models, (result, {
    category,
    model
  }, index) => {
    result.push({
      category,
      model
    });
  });

  if (dupMibKey != null) {
    await dbRef.mibEntry.child(dupMibKey).update({
      updatedAt: dbTime,
      models: newModels,
      status,
      feature
    }).catch(error => errorHandler(https, error)); // Renew "dbRef.mibDownload", by creating a group update to handle adding for new and removing for old

    const mergedMibUrls = await dbRef.mibDownload.orderByKey().startAt(`${custom}_${version}`).once('value').then(sn => {
      const oldMibUrlsToNull = (0, _lodash.transform)((0, _lodash.keys)(sn.val()), (result, value, index) => {
        result[value] = null;
      }, {});
      return (0, _lodash.mergeWith)(oldMibUrlsToNull, mibUrls, (x, y) => x || y);
    }).catch(error => errorHandler(https, error));
    await dbRef.mibDownload.update(mergedMibUrls).catch(error => errorHandler(https, error));
  } else {
    await dbRef.mibEntry.push({
      createdAt: dbTime,
      updatedAt: dbTime,
      models: newModels,
      status,
      feature
    }).catch(error => errorHandler(https, error));
    await dbRef.mibDownload.update(mibUrls).catch(error => errorHandler(https, error));
  }

  return res.status(200).json({
    message: 'ok'
  });
});
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.naturalSorting = naturalSorting;
exports.schemas = void 0;

var _validate = _interopRequireDefault(require("validate"));

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function naturalSorting(data, key, option = 'asc') {
  return option === 'asc' ? data.slice().sort((a, b) => a[key].localeCompare(b[key], undefined, {
    numeric: true
  })) : data.slice().sort((a, b) => b[key].localeCompare(a[key], undefined, {
    numeric: true
  }));
}

const customs = {
  forMib: () => [
  /*
    'lantech' for higher authority to view all custom below,
    therefore adding below custom requires add 'lantech' too.
  */
  'lantech_lantech', 'lantech_turkey', 'lantech_germany', 'lantech_canada', 'lantech_hytec', 'lantech_lgu+', 'lantech_ruf', 'lantech_ltdp', 'lantech_tekdis', 'lantech_acrobel', 'lantech_intrising', 'lantech_trafsys', 'lantech_21net']
};
const categories = ['swix1', 'swix2', 'wrouter', 'router', 'routerx'];
const newRules = {
  url: {
    use: {
      useUrlCheck: val => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(val)
    },
    message: {
      useUrlCheck: path => `${path} must be a valid URL.`
    }
  }
};
/* FYR: https://www.npmjs.com/package/validate */

const schemas = {
  show: errors => {
    return (0, _lodash.transform)(errors, (result, error, index) => {
      const {
        path,
        message
      } = error;
      result[path] = message;
    }, {});
  },
  reqBody: {
    mib: new _validate.default({
      version: {
        type: String,
        required: true
      },
      custom: {
        type: String,
        required: true,
        enum: customs.forMib()
      },
      models: {
        type: Array,
        required: true,
        each: new _validate.default({
          category: {
            type: String,
            required: true,
            enum: categories
          },
          layer2Url: {
            type: String,
            ...newRules.url
          },
          layer3Url: {
            type: String,
            ...newRules.url
          },
          model: {
            type: String,
            required: true
          }
        })
      },
      status: {
        type: String,
        required: true,
        enum: ['release', 'beta', 'alpha', 'develop']
      },
      feature: {
        type: String,
        required: false
      }
    }),
    firmware: new _validate.default({
      version: {
        type: String,
        required: true
      }
    })
  },
  db: {}
};
exports.schemas = schemas;
