const fRef = require('../firebaseRef')
// const fAdmin = require('firebase-admin')
const schedule = require('node-schedule')

// fake responser for ajax2ws
const responser = {
  code: null,
  send: (msg) => {
    console.log('RESPONSER send', msg)
    return msg
  },
  status: (code) => {
    console.log('RESPONSER status', code)
    return this.send
  }
}

class Scheduler {
  constructor () {
    this.entries = {}
  }

  async startFRDBConn (db) {
    if (!db) throw new Error('db is required.')

    /* ------------------------------- child_added ------------------------------ */
    db.ref('scheduler').on(
      'child_added',
      (snapshot, prevChildKey) => {
        console.log('child_added', snapshot.key, snapshot.val())
        const schId = snapshot.key
        const schEntry = snapshot.val()
        const schedule = schEntry.schedule
        schEntry.messages.forEach(x => {
          const cb = async () => {
            // ajax2ws(x.params.deviceId, {...x}, {...responser})
            await db.ref('scheduler').child(schId).child('status').set('running')
            console.log('TRIGGERED', x.params.deviceId, { ...x }, { ...responser })
            await db.ref('scheduler').child(schId).child('status').set('done')
            await db.ref('scheduler').child(schId).remove().catch(err => console.error(err))
          }

          // has schedule and in the future
          db.ref('scheduler').child(schId).child('status').set('ready')
          if (schedule && new Date().getTime() > schedule) {
            const cfg = new Date(x.schedule)
            this.set(schId + x.id, cfg, cb)
          } else {
            cb()
          }
        })
        this.get()
      },
      (error) => {
        console.error(error)
        this.closeFRDBConn(db)
      })

    /* ------------------------------ child_removed ----------------------------- */
    db.ref('scheduler').on(
      'child_removed',
      (oldChildSnapshot) => {
        console.log('child_removed', oldChildSnapshot.val())
        const schId = oldChildSnapshot.key
        const schEntry = oldChildSnapshot.val()
        // if (schEntry.status == null || schEntry.status === 'ready') {
        schEntry.messages.forEach(x => {
          this.cancel(schId + x.id)
        })
        // }
        this.get()
      },
      (error) => {
        console.error(error)
        this.closeFRDBConn(db)
      })

    /* ------------------------------ child_changed ----------------------------- */
    // db.ref('scheduler').on(
    //   'child_changed',
    //   (childSnapshot, prevChildKey) => {
    //     // TODO process every remote action request
    //     console.log('child_changed', childSnapshot.val())
    //     // ajax2ws()
    //   },
    //   (error) => {
    //     console.error(error)
    //     this.closeFRDBConn(db)
    //   })
  }

  closeFRDBConn (db) {
    db.off()
  }

  get () {
    console.log('ENTRIES', this.entries)
  }

  set (id, cfg, cb) {
    // if already exists
    if (this.entries[id]) {
      this.entries[id].cancel(false)
    }

    // scheduled and save to pool for future manupulation
    this.entries[id] = schedule.scheduleJob(cfg, cb)
  }

  cancel (id) {
    if (this.entries[id]) {
      this.entries[id].cancel(false)

      // delete canceled task entry
      delete this.entries[id]
    }
  }
}

async function run () {
  const {
    db
  } = await fRef.init('admin', 'intriot')
  const sch = new Scheduler()
  await sch.startFRDBConn(db)
}

run()
