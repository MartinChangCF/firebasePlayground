import * as lantechHub from './lib/lantechHub'
import { resolve } from 'path'

// import { close, init } from './lib'
// import axios from 'axios'
// import { writeFileSync } from 'fs'
// import _ from 'lodash'

global.appRoot = resolve(__dirname)

main()

async function main () {
  console.time('Main process')

  await lantechHub.go20191107()

  console.timeEnd('Main process')
  process.exit()
}
