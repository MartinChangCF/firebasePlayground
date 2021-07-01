import { throws } from 'assert'
import axios from 'axios'
import https from 'https'
import formData from 'form-data'

/* 
{
  "account": "...",
  "password": "..."
}
*/
import key from './key.json'

const ip = '192.168.1.1'
const apref = `https://${ip}/`
const auth = new formData()
auth.append('account', key.account)
auth.append('password', key.password)

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})
const cfg = {
  headers: {
    ...auth.getHeaders()
  }
}

async function login () {
  return instance.post(apref+'login', auth, cfg).then(r => {
    const {status, statusText} = r
    if (status === 200) {
      console.count("login ok")
    } else {
      throw new Error(statusText)
    }
  }).catch(err => {
    console.count("login failed")
    console.error(err)
  })
}

async function logout () {
  return instance.post(apref+'logout').then(r => {
    const {status, statusText} = r
    if (status === 200) {
      console.count("logout ok")
    } else {
      throw new Error(statusText)
    }
  }).catch(err => {
    console.count("logout failed")
    console.error(err)
  })
}

async function main () {
  console.group('Main Process')
  console.time('Main process')

  const count = Infinity
  for (let i = 1; i <= count; i++) {
    await login()
    await logout()
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

main()
