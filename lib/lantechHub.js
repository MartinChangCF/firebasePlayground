import _ from 'lodash'
import { close, dbTime, init, logObj } from './firebaseRef'

// some old stuff before 2019/11/05
export async function initNewPrivateMib (db) {
  console.group('> Build new private mib')
  console.time('==> cost')
  const product = await db.ref('network/product').once('value').then((sn) => sn.val())
  const pMibs = await db.ref('privateMIB').once('value').then((sn) => {
    return sn.val()
  }).catch((error) => {
    console.log('err', error)
  })

  let newPrivateMib = {
    versions: [],
    downloadLinks: {}
  }

  // Check how many version currently exist.
  const pMibsVersion = []
  for (let model in pMibs) {
    if (product[model] == null) {
      console.log(model)
      continue
    }
    const mib = pMibs[model]
    const {
      bugFixed,
      feature,
      url,
      urlL3,
      createdAt,
      updatedAt
    } = mib
    const versionSearch = feature.match(/[vV]([0-9]\.){2}[0-9]/g)
    let version = versionSearch != null ? versionSearch[0] : 'v1.0.0'
    if (url != null) newPrivateMib.downloadLinks[`${version.replace(/\./g, '')}_${model}_l2`] = url
    if (urlL3 != null) newPrivateMib.downloadLinks[`${version.replace(/\./g, '')}_${model}_l3`] = urlL3
    pMibsVersion.push({
      version,
      model,
      l2: url != null,
      l3: urlL3 != null,
      feature,
      bugFixed,
      createdAt,
      updatedAt
    })
  }
  const groupByVesrion = _.groupBy(pMibsVersion, 'version')
  for (let version in groupByVesrion) {
    const list = groupByVesrion[version]
    const maxCreatedAt = _.maxBy(list, 'createdAt').createdAt
    const maxUpatedAt = _.maxBy(list, 'updatedAt').updatedAt
    const commonFeature = list[0].feature
    newPrivateMib.versions.push({
      version,
      feature: commonFeature,
      models: list.map(({
        model,
        l2,
        l3
      }) => ({
        model,
        l2,
        l3
      })),
      createdAt: maxCreatedAt,
      updatedAt: maxUpatedAt,
      status: 'release'
    })
  }
  newPrivateMib.versions = _.orderBy(newPrivateMib.versions, 'version')

  for (let nv of newPrivateMib.versions) {
    await db.ref('newPrivateMib').child('versions').push(nv)
  }
  for (let lid in newPrivateMib.downloadLinks) {
    const link = newPrivateMib.downloadLinks[lid]
    await db.ref('newPrivateMib').child('downloadLinks').child(lid).set(link)
  }
  console.timeEnd('==> cost')
  console.groupEnd()
}

export async function updateVersionModelInfo (db) {
  console.group('> Update version model info')
  console.time('==> cost')
  const versions = await db.ref('newPrivateMib').child('versions').once('value').then((sn) => sn.val())
  const prod = await db.ref('network').child('product').once('value').then((sn) => sn.val())
  for (let vid in versions) {
    const version = versions[vid]
    const {
      models
    } = version
    for (let i in models) {
      const {
        model
      } = models[i]
      const theProd = prod[model]
      if (theProd != null) {
        const {
          category = '', custom = ''
        } = theProd
        models[i] = {
          ...models[i],
          category,
          custom
        }
      } else {
        console.log(`> No ${model} match.`)
      }
    }
    await db.ref('newPrivateMib').child('versions').child(vid).child('models').set(models)
    await db.ref('newPrivateMib').child('versions').child(vid).child('moodels').remove()
  }
  console.timeEnd('==> cost')
  console.groupEnd()
}

export async function manualUpdateV104 (db) {
  console.group('> Manual import mib links')
  console.time('==> cost')
  let newModels = [{
    version: 'v1.0.4',
    model: 'TPES-L6424XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1L9HyHd1FtcAGAlDy-897DT93E-8xGVAV',
    l3Url: 'https://drive.google.com/uc?export=download&id=1RliHg3CgXrzO_BUASo_Db3PtzZj7NezS'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L6424XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1cputTpwnZfZZTNVxSuL0h7Mz2ICRkxEU',
    l3Url: 'https://drive.google.com/uc?export=download&id=11oS7nENv4YsJ4Z02RLclFefXpF3Z612k'
  },
  {
    version: 'v1.0.4',
    model: 'TES-L6208XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1LTCRoq9GaJ5OSZzZjFi8jCilMIQfjuU7',
    l3Url: 'https://drive.google.com/uc?export=download&id=1iqBvqzmCzpcm7jmNLAS3cowTOCLIJkI8'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-L6416XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1wf8dgLrgNVve-rRrfJCE347tC4gh6IZW',
    l3Url: 'https://drive.google.com/uc?export=download&id=1bBIQa0xoyB8FNghwUeexKNqLASOg75OX'
  },
  {
    version: 'v1.0.4',
    model: 'TES-L5216MGT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1MOdmo-XYiWNMARgIjRECjka0MguU_ARg',
    l3Url: 'https://drive.google.com/uc?export=download&id=1X5ebRXuqqZqD9UDK4dQnDw8csdQuXQ8t'
  },
  {
    version: 'v1.0.4',
    model: 'TGS-L5016T',
    l2Url: 'https://drive.google.com/uc?export=download&id=1uGKEFopnxZoJlGwtX9uJykxXgIaWSZmw',
    l3Url: 'https://drive.google.com/uc?export=download&id=1uH_d7iTYzJySfd2hQzw7pfu6L6EJPfpC'
  },
  {
    version: 'v1.0.4',
    model: 'IGS-6416XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1uakJSRl4B9Ksx1RJj9IMOcw_JDDM1N4V',
    l3Url: 'https://drive.google.com/uc?export=download&id=12f6bwF8O-B00P2qhv0kVVOyOnO2Po7mT'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-L5216MGT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1iNC0L8YuI6mvxD9E7_XwuKC5TIXWiS7D',
    l3Url: 'https://drive.google.com/uc?export=download&id=10TnV7C0IsuhDQ8liSJygjxJZ6pqC44I8'
  },
  {
    version: 'v1.0.4',
    model: 'TES-L6416XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1oJKGNutUF3HdTMuhw6suNMTUmpGOfV1L',
    l3Url: 'https://drive.google.com/uc?export=download&id=15pzsNfvU0zbebXlPIjLjp0wKL8Z3MkeU'
  },
  {
    version: 'v1.0.4',
    model: 'IPGS-5488MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1y2s10kh_RxnQREaDti6VkhxZcNAMLuRS',
    l3Url: 'https://drive.google.com/uc?export=download&id=1bhtS1VLmKtneC0KCagDSz2yQ9jmo8bhD'
  },
  {
    version: 'v1.0.4',
    model: 'TGS-L5216MGT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1yd7C5vL2DMnKn_1u3TGeT7AS0fMbXBRr',
    l3Url: 'https://drive.google.com/uc?export=download&id=1BZ1ZKkutgJ5x28ECV3sZ3RC8UTCmYZHi'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L5216MGT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=17HJnKU_iqI31rpGMFs9kH10fqZncO6sJ',
    l3Url: 'https://drive.google.com/uc?export=download&id=1TP4v2sZKdF900lqsq1A9YD9YtHGpWw1J'
  },
  {
    version: 'v1.0.4',
    model: 'TES-L6424XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1IMyc1XH97so6H-0xg4iEm6JJ8gzxC0J8',
    l3Url: 'https://drive.google.com/uc?export=download&id=10eNHBKEdlZ7b8V59RURiT8j2bZSm8EIB'
  },
  {
    version: 'v1.0.4',
    model: 'IGS-5488MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1lZyqSUl9OXWvzel5TL04LnTncCEgJusp',
    l3Url: 'https://drive.google.com/uc?export=download&id=1hKMR_B2qzrF1FctcwEnxg3rLhVunWLsv'
  },
  {
    version: 'v1.0.4',
    model: 'IPGS-6416XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=16N3ViPi85RqGokZOagfyoqTUFVCNFcBt',
    l3Url: 'https://drive.google.com/uc?export=download&id=1rFismdeZqz2MN75IT2s3OKLpUdGglNEg'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-L5016T-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=19r59TnfdjY6_51TDiya_gDwvc-Z7eLIz',
    l3Url: 'https://drive.google.com/uc?export=download&id=1ZCFL4eGDBX9EHLWCjwUJMmRgJy5rpARJ'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L6216XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1kwfPMscFeYeB_imH0ggV-7EJBIFtEAlI',
    l3Url: 'https://drive.google.com/uc?export=download&id=169NlFhDgN6WzRwzoqZlyP7wjyrt6tl8T'
  },
  {
    version: 'v1.0.4',
    model: 'IPGS-6488XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1bFNAk2ZFI-bqrVIh4OOnldLy32r6Tfe7',
    l3Url: 'https://drive.google.com/uc?export=download&id=1n6Is46ozKn1nMLiXw-5LzHy76KBnimEu'
  },
  {
    version: 'v1.0.4',
    model: 'TES-L6216XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1hs9Nljo6HqVZNT93xs1uzDvTWgPrjJ2d',
    l3Url: 'https://drive.google.com/uc?export=download&id=1ZnmflnKuBHXuF5LUl9XtCVma2axvm0te'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L6416XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1twAvoUdkA2OKDllwZ9hQ8OFWblOEhBhK',
    l3Url: 'https://drive.google.com/uc?export=download&id=16d0M8SBf6lqG96tZQK5Hq_dlkklDKTBg'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L6408XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1zNzfT-OF_mMmlk2oBzaUru9UKZru6fUv',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Ct9WlvT_Mv9WXeTp7FujDEl1wofEIbUR'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-L6216XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1I6q_yYrxnPBN007e1BhlclGD1uJ-deGW',
    l3Url: 'https://drive.google.com/uc?export=download&id=1og9Uh_HEV9_r0BXQJ8p0QtxPCZMmYPwn'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L5216MGT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1hQuFdPr2PoiQo8QzVb-eiKqMMLpBDKA4',
    l3Url: 'https://drive.google.com/uc?export=download&id=1CNCgrqZSB8HbL_CYag37Yq8KaDnpt4Ec'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-L5216MGT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1H4M7xo85ISpm_oiIdexI1M092xWgHV_G',
    l3Url: 'https://drive.google.com/uc?export=download&id=1I3OIKBJvm6iCivCOrZmJfNtg3jHNovy5'
  },
  {
    version: 'v1.0.4',
    model: 'IPGS-5416MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1iOqynr5Z6kQZmFk5QHXoVnOwYeGtM6vN',
    l3Url: 'https://drive.google.com/uc?export=download&id=1SNDAhq82-gnGkaq98fjCG0_G2hTRL612'
  },
  {
    version: 'v1.0.4',
    model: 'IGS-6488XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=19FlXsMFfBkWHYJoIYtwIKxaHfS5O5Wgh',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Kf8baNIMot1zo1GLUG_mQg-UFZo2ii1X'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-L6208XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1RyP4qNr3R7iz3TY106TNjzXSLRf8N2fF',
    l3Url: 'https://drive.google.com/uc?export=download&id=1teHSryAMf_fG-ZiEFNUTkmYWPGlY04m2'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-6616XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1hfsTQpb2dpuWRZeuLbo9OtdYybaMId7x',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Xqdbkco6dzs-SvHUdaUdYe-TMHLOUDKE'
  },
  {
    version: 'v1.0.4',
    model: 'TPGS-R6616XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1eYSk45PIDpOJkHag6hGg0jQzISkHZqIX',
    l3Url: 'https://drive.google.com/uc?export=download&id=1GmS1aGPhT70xIPD9PJ-wNJyM_Ilg3TXX'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-R6616XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1xKc7J_kcxHMRNd5FLAv-fIYwcBCr7dS8',
    l3Url: 'https://drive.google.com/uc?export=download&id=19SDZsfx4Q-xj-Tu1hBEuIoBuQTW2tyL6'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-R6616XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1wEEYSCzKPEED9DxOfabP7lof9HeCSplg',
    l3Url: 'https://drive.google.com/uc?export=download&id=1RUNGe5LbnLzcmpGiFwOwiAIiHqmNyyEz'
  },
  {
    version: 'v1.0.4',
    model: 'TPES-6616XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1QTdIar4xsbh7uVOMV9mk1r2eJ4nb0Cxn',
    l3Url: 'https://drive.google.com/uc?export=download&id=1vQ1TZ2dPXwemd2OpwKZLztjbisbuy6KH'
  },
  {
    version: 'v1.0.5',
    model: 'IGS-6488XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=12b5Qqj5u6fq8O8ePNlLPwMkpHFh_tSGm',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Ptjagqj7_7DqnJNDoHRk4bKAw-d6HeRK'
  },
  {
    version: 'v1.0.5',
    model: 'IPGS-6416XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=12h_-eHoyA8weKRJx5Z9HX1F7lrzoBJpG',
    l3Url: 'https://drive.google.com/uc?export=download&id=1U96kRGq4mUqREEOcTZQ3KZTpvxMU-kBv'
  },
  {
    version: 'v1.0.5',
    model: 'TES-L6208XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1x5lM-jTZTnQ7ftztb4gxMR3jeT8bimp1',
    l3Url: 'https://drive.google.com/uc?export=download&id=1C9UeN5De0nqQudcugtJEoRM61TlqQeWq'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6416XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1poTZtdzX7TTYTbio4hRVUzwT9ASqUcGy',
    l3Url: 'https://drive.google.com/uc?export=download&id=1TpgdjPES1GA7LEPLPHYqcJKHvoVxt6Nb'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L5216MGT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1gH6YLbc_YSD3msm6Do1jgq7MCaP--J4Y',
    l3Url: 'https://drive.google.com/uc?export=download&id=1-QV-o4TNS-Nhh6kSvG-xcM4kbSN4xnRv'
  },
  {
    version: 'v1.0.5',
    model: 'TES-L6416XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1zjXGTUh8IpBpkxoGtrWB2oyBdU1xlHnv',
    l3Url: 'https://drive.google.com/uc?export=download&id=1v5FwWJ532paD4Crz1sDnIcdY1DLxiKHO'
  },
  {
    version: 'v1.0.5',
    model: 'TES-L5216MGT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1xQZ9j6zvI2Qp67ppkGiH5N_xk_XYSOFu',
    l3Url: 'https://drive.google.com/uc?export=download&id=1TsbBGMN82rhWRYi1xjrSdc6ZrLnRDci4'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-L5216MGT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1Ah3Xf6Pr-k3qDRVsZauT8rVqtzzARY1Q',
    l3Url: 'https://drive.google.com/uc?export=download&id=1BEnQF4vAg-pbbVfpEewE9MqNQzvvDjGU'
  },
  {
    version: 'v1.0.5',
    model: 'IGS-6416XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1nGPT05XU3_Z3pkqHskXeRIjTGWrsg-JH',
    l3Url: 'https://drive.google.com/uc?export=download&id=1qoefExcBYTqoMCVfkiIw-EfPqZ9HMFot'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6424XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1wzFpYVr3cgIrxyp2y77UvXjwtnOPCA_c',
    l3Url: 'https://drive.google.com/uc?export=download&id=1h60ANscVI9svNv4dFtt-aR8-uZzC7ZjG'
  },
  {
    version: 'v1.0.5',
    model: 'TES-L6216XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1pGxFQ5SkytFOChg65lDLldVqVKa-AY-L',
    l3Url: 'https://drive.google.com/uc?export=download&id=1qn5vGhuo89pYzWFx5BMqvwoG2hfEZDmd'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6208XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1zA8spGRdkRLcGQQCIuZOC_uBBBKnQMzr',
    l3Url: 'https://drive.google.com/uc?export=download&id=1itv-xr-x2GMfwKaSZON8XcAA4KRzSQr7'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6424XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1bPCWmnstTQqhmEBxeZIRjSsj1YfRdSm0',
    l3Url: 'https://drive.google.com/uc?export=download&id=1bvi7jXMHzgIUv9kSI51jSKkI-krAOmQ9'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-L6416XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1K2-CTsdTNTkmsafbfrL3GrKWxaCiMO_F',
    l3Url: 'https://drive.google.com/uc?export=download&id=1pUdooWrEavtV942UmxWtGKUu5LOIwUD9'
  },
  {
    version: 'v1.0.5',
    model: 'TGS-L5016T',
    l2Url: 'https://drive.google.com/uc?export=download&id=1-PgGbK0yJfmKsi_pbXiz74NJfxWBlq4D',
    l3Url: 'https://drive.google.com/uc?export=download&id=1QOCB6uTBO4XFiZhmpgqr1dWXsBJNJv3N'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-L5216MGT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1V8SkcjVMTe8fL6kg5hitcvgAOOWPwMi1',
    l3Url: 'https://drive.google.com/uc?export=download&id=11nrIoSAPnEH6vJ4RT43H8HuFxfkY3vmi'
  },
  {
    version: 'v1.0.5',
    model: 'TES-L6424XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1_5uSvlcos0NI_jSfbEHG4AE8HDU1dL4s',
    l3Url: 'https://drive.google.com/uc?export=download&id=13h2HSerJkKt0DPN5d8JSCm6FGvZqgQWH'
  },
  {
    version: 'v1.0.5',
    model: 'IPGS-6488XSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1Va_Y3jmFhn-Y-byEmR4mYBVSgIa_2sCY',
    l3Url: 'https://drive.google.com/uc?export=download&id=1EUJnE5NA4OvNCN8Q_TBbgBoOSB-z3av7'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-L5016T-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1SBmmc2rUGhxE9X_UyTYkOx3e-y_O2dEn',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Z231qBojnAqSqvgiC2fwT5jLMI6CpB-O'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6216XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1SYT31GEMk09507L6huv0RNylQ_YCcwmS',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Rxa0VHA1QwS3BIYbxKl94E51NrfpH8hG'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-L6216XT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1I7skuBcyZIE-F4UnLfa_oU5_YXdrIj8u',
    l3Url: 'https://drive.google.com/uc?export=download&id=1ak_V4GSuPnzYd0s_y-IFqJMah423KxUd'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L6408XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=1a4WKuormp0C_uQY379HTF6aLtAJ0TxFl',
    l3Url: 'https://drive.google.com/uc?export=download&id=12LrVQ_y0IowwxcOU4LSMHx99nrg9wZ4Z'
  },
  {
    version: 'v1.0.5',
    model: 'IPGS-5488MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1KsPR_hknYbhuVG0txNeudMevZBn9Ygd8',
    l3Url: 'https://drive.google.com/uc?export=download&id=1DPwpZt0T7gWRS3dxXdzzFqFJeUVZ2-GK'
  },
  {
    version: 'v1.0.5',
    model: 'IGS-5488MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1SXzJsTCDkqzLQdIj2AsIE5Q_ZcZsgE7k',
    l3Url: 'https://drive.google.com/uc?export=download&id=1rmDUG0H384ooorSRvI9760ZG6Hjm8Sj7'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-L5216MGT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=1s35egfDkKulBKz58TjbffSTUE8rL3PRF',
    l3Url: 'https://drive.google.com/uc?export=download&id=1P9N5zhIxIxRaxpTDCq_JgD4hbhT88hCR'
  },
  {
    version: 'v1.0.5',
    model: 'IPGS-5416MGSFP',
    l2Url: 'https://drive.google.com/uc?export=download&id=1LhLfg6VYC3IgVGUho4zG5e0pew5WSejK',
    l3Url: 'https://drive.google.com/uc?export=download&id=1cvlTej3ED3QxflW0WrM1qc7YhplRVGGO'
  },
  {
    version: 'v1.0.5',
    model: 'TGS-L5216MGT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1zZu9buNLNi5xYnonWZ5uobxP2fF52-ot',
    l3Url: 'https://drive.google.com/uc?export=download&id=1kQGDqJLLGfjUYRzDCCLmROYulZds_pmL'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-R6616XFT-16',
    l2Url: 'https://drive.google.com/uc?export=download&id=16N6bTxsjJcuoQIVm0iIt5j7uy19fDu2W',
    l3Url: 'https://drive.google.com/uc?export=download&id=1xRSCS_zMimfsGkPJIVJ_soQ17-XKDOpq'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-R6616XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=187mqc1dZ5bkGaUM_crOsO1OaHe96Zu5g',
    l3Url: 'https://drive.google.com/uc?export=download&id=1VR3KdLe07gGp6Xd8bnFC1j9q1UZpe6H1'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-6616XFT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1-vUh4vXvoFOTWithe8aIJ3Vrf3HiXPVA',
    l3Url: 'https://drive.google.com/uc?export=download&id=1H55_kpU9UB78-SiW6iZphYeoAd_GXMub'
  },
  {
    version: 'v1.0.5',
    model: 'TPES-6616XT',
    l2Url: 'https://drive.google.com/uc?export=download&id=1vgsr9flBgAyDGHfku4wteqvZGheCdvwU',
    l3Url: 'https://drive.google.com/uc?export=download&id=1cxPwXVenh0_Gu75RDBDIgkP6OL-HUZc4'
  },
  {
    version: 'v1.0.5',
    model: 'TPGS-R6616XT-10',
    l2Url: 'https://drive.google.com/uc?export=download&id=10UC7Hw1viHiB1tgoQdN_VnpMKz2Ixhi9',
    l3Url: 'https://drive.google.com/uc?export=download&id=1Z0bzATmL2k4g5QLgnr77G0Yu-iB_eSPd'
  }
  ]
  const ref = db.ref('newPrivateMib')
  const versions = await ref.child('versions').once('value').then((sn) => sn.val())
  const products = await db.ref('network/product').once('value').then(sn => sn.val())

  for (let vid in versions) {
    const {
      models,
      version
    } = versions[vid]
    const nonDupNewModels = newModels.filter(x => x.version === version && models.every(y => y.model !== x.model)).map(z => {
      const {
        model,
        l2Url,
        l3Url
      } = z
      const {
        category,
        custom
      } = products[model]
      return {
        model,
        category,
        custom,
        l2: l2Url != null && l2Url !== '',
        l3: l3Url != null && l3Url !== ''
      }
    })
    logObj({
      version,
      nonDup: nonDupNewModels.length,
      dup: newModels.length - nonDupNewModels.length
    })
    await ref.child('versions').child(vid).child('models').set([...models, ...nonDupNewModels])
  }

  for (let {
    version,
    model,
    l2Url,
    l3Url
  } of newModels) {
    if (l2Url != null || l2Url !== '') await ref.child('downloadLinks').child(`${version.replace(/\./g, '')}_${model}_l2`).set(l2Url)
    if (l3Url != null || l3Url !== '') await ref.child('downloadLinks').child(`${version.replace(/\./g, '')}_${model}_l3`).set(l3Url)
  }
  console.timeEnd('==> cost')
  console.groupEnd()
}

// 2019/11/07
export function normalize (text) {
  // status
  switch (text) {
    case 'Production':
    case 'release':
      return 'release'
    case 'beta':
      return 'beta'
    case 'alpha':
      return 'alpha'
    case 'Develop':
    case 'dev':
      return 'develop'
    case 'Sample':
      return 'sample'
    case 'disabled':
      return 'disabled'
  }

  // custom
  switch (text) {
    case 'Lantech':
    case 'lantech':
      return 'lantech_lantech'
    case 'Turkey':
    case 'turkey':
      return 'lantech_turkey'
    case 'Germany':
    case 'germany':
      return 'lantech_germany'
    case 'Canada':
    case 'canada':
      return 'lantech_canada'
    case 'Hytec':
    case 'hytec':
      return 'lantech_hytec'
    case 'LGU+':
    case 'lgu+':
      return 'lantech_lgu+'
    case 'Ruf':
    case 'ruf':
      return 'lantech_ruf'
    case 'Ltdp':
    case 'ltdp':
      return 'lantech_ltdp'
    case 'Tekdis':
    case 'tekdis':
      return 'lantech_tekdis'
    case 'Acrobel':
    case 'acrobel':
      return 'lantech_acrobel'
    case 'Intrising':
    case 'intrising':
      return 'lantech_intrising'
    case 'Trafsys':
    case 'trafsys':
      return 'lantech_trafsys'
    case '21net':
      return 'lantech_21net'
    case 'Pan Dacom':
    case 'pandacom':
      return 'lantech_pandacom'
    default:
      return 'undefine'
  }
}

export async function go20191107 () {
  console.time('2019/11/07')
  console.group('2019/11/07')

  await reconstructProduct()
  await testPermissionProduct()

  console.groupEnd()
  console.timeEnd('2019/11/07')
}

export async function go20191108 () {
  console.time('2019/11/07')
  console.group('2019/11/07')

  await reconstructMib()
  await testPermissionMib()

  console.groupEnd()
  console.timeEnd('2019/11/07')
}

export async function reconstruct () {
  console.time('Start recontruct')
  console.group('Start recontruct')

  await reconstructProduct()
  await reconstructMib()

  console.groupEnd()
  console.timeEnd('Start recontruct')
}

export async function reconstructProduct () {
  console.time('Recontruct Product')
  console.group('Recontruct Product')

  const { db } = await init('admin', 'testHub')
  process: { // eslint-disable-line
    const currProd = await db.ref('network/product').once('value').then((sn) => sn.val())
    const newProd = _.transform(currProd, (result, prod, model) => {
      const {
        board,
        category,
        createdAt,
        custom,
        description,
        mmsCID: mmsCid = '', // something familiar to MIB
        status,
        updatedAt
      } = prod

      let txt = ''
      let newCustom = _.transform(custom, (result, value, index) => {
        txt = normalize(value)
        result[txt] = txt
      }, {})

      result[model] = {
        board,
        category,
        createdAt,
        custom: newCustom,
        description,
        mmsCid,
        status: normalize(status),
        updatedAt
      }
    }, {})

    // check if number is corrent ?
    console.group('Compare curr & new Prodcut structure')
    const currProdCount = _.size(currProd)
    const newProdCount = _.size(newProd)
    if (currProdCount !== newProdCount) {
      console.group('X - not equal')
      logObj({
        currProdCount,
        newProdCount
      })
      console.groupEnd()
      console.groupEnd()
      break process // eslint-disable-line
    } else {
      console.groupEnd()
    }

    // renew product
    let isErr = false
    for (let model in newProd) {
      isErr = await db.ref('product').child(model).set(newProd[model])
        .then(() => {
          console.log(`O - ${model} - done`)
          return false
        })
        .catch((error) => {
          console.group(`X - ${model} - model renew error`)
          console.log(error)
          console.groupEnd()
          return true
        })
      if (isErr) break
    }
  }

  console.groupEnd()
  console.timeEnd('Recontruct Product')
  db.goOffline()
}

export async function testPermissionProduct () {
  console.time('Test Permission - Product')
  console.group('Test Permission - Product')

  const {
    db,
    uid
  } = await init('app', 'testHub')
  test1: { // eslint-disable-line
    console.group('Try to get PRODUCT with USER custom')
    const {
      custom: targetCustom = null
    } = await db.ref('user').child(uid).once('value')
      .then((sn) => {
        return sn.val()
      })
      .catch((error) => {
        console.group(`Get ${uid} info error`)
        console.log(error.code)
        console.groupEnd()
        return {}
      })
    if (targetCustom == null) {
      break test1 // eslint-disable-line
    }
    const prodList = await db.ref('product').orderByChild(`custom/${targetCustom}`).equalTo(targetCustom).once('value')
      .then((sn) => {
        const prodList = sn.val()
        return prodList
      })
      .catch((error) => {
        console.group(`Get ${targetCustom} error`)
        console.log(error.code)
        console.groupEnd()
        return null
      })
    if (prodList == null) {
      break test1 // eslint-disable-line
    }
    console.group(`Get ${targetCustom}:`)
    console.log(`Successfully get ${_.size(prodList)} products.`)
    console.groupEnd()
    console.groupEnd()
  }

  test2: { // eslint-disable-line
    console.group('Try to get PRODUCT with irrelavant custom')
    const targetCustom = 'lantech_lantech' // user's custom is lantech_acrobel
    const prodList = await db.ref('product').orderByChild(`custom/${targetCustom}`).equalTo(targetCustom).once('value')
      .then((sn) => {
        const prodList = sn.val()
        return prodList
      })
      .catch((error) => {
        console.group(`Get ${targetCustom} error`)
        console.log(error.code)
        console.groupEnd()
        return null
      })
    if (prodList == null) {
      break test2 // eslint-disable-line
    }
    console.group(`Get ${targetCustom}:`)
    console.log(`Successfully get ${_.size(prodList)} products.`)
    console.groupEnd()
    console.groupEnd()
  }

  console.groupEnd()
  console.timeEnd('Test Permission - Product')
  close(db)
}

export async function refineMibApiSop () {
  console.time('Refine the SOP of import MIB API')
  console.group('Refine the SOP of import MIB API')

  /*
    0. auth check
    1. req check
    2. params check
    3. check intention Create, Upate
    4. recreate mib structure
  */

  console.groupEnd()
  console.timeEnd('Refine the SOP of import MIB API')
}

export async function reconstructMib () {
  /* TODO: define the new mib structure and simulate the new API import feature */
  console.time('Reconstruct MIB')
  console.group('Reconstruct MIB')

  const { db } = await init('admin', 'testHub')

  process: { // eslint-disable-line
    const currMibs = await db.ref('newPrivateMib/versions').once('value').then((sn) => sn.val())
    const newMibs = _.transform(currMibs, (result, mibInstance, versionKey) => {
      const {
        createdAt = dbTime(),
        feature = '',
        models = null,
        status = '',
        updatedAt = dbTime(),
        version = ''
      } = mibInstance

      const formattedVersion = version.split('.').join('!')
      for (let {category, custom, l2, l3, model} of models) {
        for (let c of custom) {
          const cv = `${normalize(c)}_${version}`
          if (result[cv] == null) {
            result[cv] = {
              createdAt,
              custom: normalize(custom),
              customVersion: '',
              feature,
              status: normalize(status),
              models: [],
              updatedAt,
              version
            }
          }
          result[cv].models.push({
            category,
            model,
            layer2: l2,
            layer3: l3
          })
        }
      }
    }, {})
    logObj(newMibs)
  }

  console.groupEnd()
  console.timeEnd('Reconstruct MIB')
}

export async function testPermissionMib () {
  console.time('Test Permission - MIB')
  console.group('Test Permission - MIB')

  // Do something

  console.groupEnd()
  console.timeEnd('Test Permission - MIB')
}
