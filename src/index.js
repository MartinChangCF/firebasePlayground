import { init } from './firebaseRef'
import { updateFsReadOnly } from './lantechHub'

async function main () {
  console.group('Main Process')
  console.time('Main process')

  try {
    const { db } = await init('admin', 'hub')
    await updateFsReadOnly(db, {
      cus: 'lantech_lantech',
      l: 2,
      cat: 'routerx'
    })
    await updateFsReadOnly(db, {
      cus: 'lantech_lantech',
      l: 3,
      cat: 'routerx'
    })
    await updateFsReadOnly(db, {
      cus: 'lantech_lantech',
      l: 2,
      cat: 'router'
    })
    await updateFsReadOnly(db, {
      cus: 'lantech_lantech',
      l: 3,
      cat: 'router'
    })
    // console.log([...fsList1, ...fsList2, ...fsList3, ...fsList4])
  } catch (error) {
    console.log(error)
  }

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

main()
