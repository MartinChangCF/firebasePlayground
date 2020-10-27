// import { updateTop50Md5ChecksumFw } from './firmware.js'

async function main () {
  console.group('ControllerHub - Main Process')
  console.time('ControllerHub - Main process')

  try {
    // await updateTop50Md5ChecksumFw()
  } catch (error) {
    console.log(error)
  }

  console.timeEnd('ControllerHub - Main process')
  console.groupEnd()
  process.exit()
}

main()
