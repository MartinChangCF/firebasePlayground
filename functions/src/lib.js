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
  forMib: () => [
    /*
      'lantech' for higher authority to view all custom below,
      therefore adding below custom requires add 'lantech' too.
    */
    'lantech_lantech',
    'lantech_turkey',
    'lantech_germany',
    'lantech_canada',
    'lantech_hytec',
    'lantech_lgu+',
    'lantech_ruf',
    'lantech_ltdp',
    'lantech_tekdis',
    'lantech_acrobel',
    'lantech_intrising',
    'lantech_trafsys',
    'lantech_21net',
    'lantech_pandacom'
  ]
}
const categories = [
  'swix1',
  'swix2',
  'wrouter',
  'router',
  'routerx'
]

const newRules = {
  url: {
    use: {
      useUrlCheck: (val) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(val)
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
        each: new Schema({
          category: {
            type: String,
            required: true,
            enum: categories
          },
          layer2Url: {
            type: String,
            ...(newRules.url)
          },
          layer3Url: {
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
        enum: [
          'release',
          'beta',
          'alpha',
          'develop'
        ]
      },
      feature: {
        type: String,
        required: false
      }
    }),
    firmware: new Schema({
      version: {
        type: String,
        required: true
      }
    })
  },
  db: {}
}
