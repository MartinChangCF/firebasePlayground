// import axios from 'axios'
import { schemas } from '../src/lib'

root()

async function root () {
  console.time('Start test')
  console.group('Start test')

  testMibSchema()

  console.groupEnd()
  console.timeEnd('Start test')
}

export function testMibSchema () {
  console.time('MIB schema')
  console.group('MIB schema')

  let errors = schemas.reqBody.mib.validate({
    version: '123',
    custom: 'lantech_lantech',
    models: [{
      category: 'swix1',
      layer2Url: '',
      layer3Url: '',
      model: 'APBP'
    }],
    status: 'release'
  })

  console.log(schemas.show(errors))

  console.groupEnd()
  console.timeEnd('MIB schema')
}
