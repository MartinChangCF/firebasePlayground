import { throws } from 'assert'
import axios from 'axios'
import https from 'https'
import key from './key.json'

const ip = '192.168.1.1:1025'
const apref = `https://${ip}/api/v1/`
const testpool = [
  'discovery/lldp/neighbour-information',
  'docker/overview',
  'eventlog/logs/log-data',
  'maintenance/firmware/status',
  'multicast/general/status',
  'multicast/igmp/statistics',
  'multicast/mld/groups',
  'multicast/mld/statistics',
  'ports/basic/status',
  'redundant/stp/bridge-status',
  'redundant/stp/port-status',
  'redundant/loop-protection/status',
  'redundant/g-8032-erps/status',
  'security/mac-address-tables/all-mac-addresses',
  'security/ieee-802-1x/status',
  'system/information',
  'system/monitoring/data',
  'system/monitoring/utilization',
  'system/firmware/data',
  'vlan/802-1q/status',
  'vlan/mvrp/status'
]

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

async function login () {
  const tk = await instance.post(apref + 'login', key).then(r => {
    const { status, statusText, data } = r
    if (status === 200) {
      return data.token
    } else {
      throw new Error(statusText)
    }
  }).catch(err => {
    console.count('login failed')
    console.error(err)
  })
  return tk
}

async function testall (token) {
  const cfg = {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
  const reqpool = testpool.map(url => {
    return instance.get(apref + url, cfg)
      .then(r => {
        const { status, statusText } = r
        if (status !== 200) {
          throw new Error(statusText)
        }
      }).catch(err => {
        console.count('request failed')
        console.error(url, err)
      })
  })
  await Promise.all(reqpool)
    .then(() => {
      console.count('ok')
    })
    .catch(err => {
      console.count('failed')
      console.error(err)
    })
}

async function testMemory () {
  const count = Infinity
  for (let i = 1; i <= count; i++) {
    const tk = await login()
    testall(tk)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// v1.0.1-a1 is will always create new token
// v1.0.1-a4 (and later) will reuse the same token if requesting from :1025 TCP port.
async function testNmpLogin () {
  // const count = Infinity
  const count = 20000
  let tk = ""
  for (let i = 1; i <= count; i++) {
    // const ntk = await login()
    const ntk = login()
    tk = ntk
    console.count("login")
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

async function main () {
  console.group('Main Process')
  console.time('Main process')

  await testNmpLogin()

  console.timeEnd('Main process')
  console.groupEnd()
  process.exit()
}

main()
