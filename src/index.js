import controllerHub from './controllerHub'

async function main () {
  console.group('Main Process')
  console.time('Main process')

  try {
    await controllerHub.ctrlerFwModelReview()
  } catch (error) {
    console.log(error)
  }

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

main()
