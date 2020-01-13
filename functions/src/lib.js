import Schema from 'validate'
import { transform } from 'lodash'

export function naturalSorting (data, key, option = 'asc') {
  return option === 'asc'
    ? data.slice().sort((a, b) => a[key].localeCompare(b[key], undefined, {
      numeric: true
    }))
    : data.slice().sort((a, b) => b[key].localeCompare(a[key], undefined, {
      numeric: true
    }))
}

const customs = {
  network: [ // For network devices
    'intrising',
    /* 'lantech_' is to identify the vendor_custom relationship */
    'lantech_21net',
    'lantech_acrobel',
    'lantech_canada',
    'lantech_germany',
    'lantech_hytec',
    'lantech_lantech',
    'lantech_lgu+',
    'lantech_ltdp',
    'lantech_optigo',
    'lantech_pandacom',
    'lantech_ruf',
    'lantech_tekdis',
    'lantech_teslakom',
    'lantech_trafsys',
    'lantech_turkey'
  ],
  controller: [ // For av over ip contoller
    'intri',
    'eagleyes',
    'evoip'
  ]
}
const categories = [
  'swix1',
  'swix2',
  'wrouter',
  'router',
  'routerx'
]

const statusOpts = [
  'release',
  // 'beta',
  // 'alpha',
  'develop'
]

const newRules = {
  url: {
    use: {
      useUrlCheck: (val) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(val) || val == null || val === ''
    },
    message: {
      useUrlCheck: (path) => `${path} must be a valid URL.`
    }
  }
}

/* FYR: https://www.npmjs.com/package/validate */
export const schemas = {
  show: (errors) => {
    return transform(errors, (result, error, index) => {
      const {
        path,
        message
      } = error
      result[path] = message
    }, {})
  },
  reqBody: {
    mib: new Schema({
      custom: {
        type: String,
        required: true,
        enum: customs.network
      },
      feature: {
        type: String,
        required: false
      },
      models: {
        type: Array,
        required: true,
        each: new Schema({
          category: {
            type: String,
            required: true,
            enum: categories
          },
          l2Url: {
            type: String,
            ...(newRules.url)
          },
          l3Url: {
            type: String,
            ...(newRules.url)
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
        enum: statusOpts
      },
      version: {
        type: String,
        required: true
      }
    }),
    firmware: new Schema({
      /*
        Removed:
        - domain (for controller, may replaced by 'custom'?)
        - model (for controller)
      */
      bugFixed: {
        type: String
      },
      category: {
        type: String,
        required: true,
        enum: categories
      },
      custom: {
        type: String,
        required: true,
        enum: customs.network
      },
      feature: {
        type: String
      },
      firmwareLayer: { // only required on category is in ['router', 'routerx']
        type: Number,
        enum: [2, 3]
      },
      md5: {
        type: String,
        required: true,
        length: 32
      },
      modelTxt: {
        type: String
      },
      status: {
        type: String,
        required: true,
        enum: statusOpts
      },
      testReportUrl: {
        type: String,
        ...(newRules.url)
      },
      url: {
        type: String,
        required: true,
        ...(newRules.url)
      },
      version: {
        type: String,
        required: true
      }
    }),
    getProductModel: new Schema({
      category: {
        type: Array,
        required: true,
        length: {
          min: 1,
          max: 4
        },
        each: {
          type: String,
          enum: categories
        }
      }
    }),
    getLatestFirmware: new Schema({
      type: Array,
      required: true,
      length: {
        min: 1,
        max: 10
      },
      each: new Schema({
        category: {
          type: String,
          required: true,
          enum: categories
        },
        vendor: {
          type: String,
          required: true,
          enum: [...customs.network, 'all']
        }
      })
    })
  },
  db: {}
}
