import { updateNoneMd5ChecksumFw } from './firmware'

async function fwDataReview () {
  console.group('Review and fix firmware data')
  console.time('Review and fix firmware data')

  try {
    await updateNoneMd5ChecksumFw()
  } catch (error) {
    console.log(error)
  }

  console.timeEnd('Review and fix firmware data')
  console.groupEnd()
}

export default {
  fwDataReview
}
