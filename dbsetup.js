#!/usr/bin/env node

import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const env = { ...process.env }

// place Sqlite3 database on volume
const prismaDir = path.resolve('prisma')
const source = path.join(prismaDir, 'dev.sqlite')
const targetDir = '/data'
const target = path.join(targetDir, 'dev.sqlite')

if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true })
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const sourceIsSymlink =
  fs.existsSync(source) && fs.lstatSync(source).isSymbolicLink()

let targetExists = fs.existsSync(target)
const targetWasPresent = targetExists

if (!sourceIsSymlink) {
  if (fs.existsSync(source) && !targetExists) {
    // move existing DB shipped with the image onto the volume
    try {
      fs.renameSync(source, target)
    } catch (error) {
      if (error.code === 'EXDEV') {
        fs.copyFileSync(source, target)
        fs.rmSync(source)
      } else {
        throw error
      }
    }
    targetExists = true
  }

  if (!targetExists) {
    fs.writeFileSync(target, '')
    targetExists = true
  }

  if (fs.existsSync(source)) {
    fs.rmSync(source)
  }

  fs.symlinkSync(target, source)
}

const newDb = !targetWasPresent
if (newDb && process.env.BUCKET_NAME) {
  await exec(`npx litestream restore -config litestream.yml -if-replica-exists ${target}`)
}

// prepare database
await exec('npx prisma migrate deploy')

// launch application
if (process.env.BUCKET_NAME) {
  await exec(`npx litestream replicate -config litestream.yml -exec ${JSON.stringify(process.argv.slice(2).join(' '))}`)
} else {
  await exec(process.argv.slice(2).join(' '))
}

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
