import { schemas } from '../src/lib'

let errors = schemas.reqBody.mib.validate({
  version: '123',
  custom: 'lantech_lantech',
  models: [
    {
      category: 'swix1',
      layer2Url: '',
      layer3Url: '',
      model: 'APBP'
    }
  ],
  status: 'release'
})

// console.log(errors.map(x => ({ [x.path]: x.message })))
console.log(schemas.show(errors))
