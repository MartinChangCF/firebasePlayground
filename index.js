import * as lantechHub from './lib/lantechHub'
import { resolve } from 'path'

// import { close, init } from './lib'
// import axios from 'axios'
// import { writeFileSync } from 'fs'
// import _ from 'lodash'

global.appRoot = resolve(__dirname)

main()

async function main () {
  console.group('Main Process')
  console.time('Main process')

  await go20191110()

  /*
  When handling firmware, there is a case needs to be aware of.
  They have a scenario that is below:
  A uses API create a firmware record with empty "feature", "bugfix"
  B uses UI to update "feature", "bugfix"
  A wants to update some of the props whcih cause the "feature", "bugfix" be erased.

  You can create a partial update when using API, only effect some column so that the others will be neglect.
  And UI can update the whole proprs...
  */

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

export async function go20191110 () {
  console.time('2019/11/10')
  console.group('2019/11/10')

  await lantechHub.reconstructUser()

  console.groupEnd()
  console.timeEnd('2019/11/10')
}
