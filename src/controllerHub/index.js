import { updateNoneMd5ChecksumFw } from './switchFirmware'
import { updateAvMediaToAspeedFw } from './controller'

async function switchFwDataReview () {
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

async function ctrlerFwModelReview () {
  console.group('Review and fix firmware model av_media to aspees')
  console.time('Review and fix firmware model av_media to aspees')

  try {
    await updateAvMediaToAspeedFw()
  } catch (error) {
    console.log(error)
  }

  console.timeEnd('Review and fix firmware model av_media to aspees')
  console.groupEnd()
}

export default {
  switchFwDataReview,
  ctrlerFwModelReview
}
