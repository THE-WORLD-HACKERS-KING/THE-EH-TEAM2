// fetch all the deps and tarballs in a v2 lockfile
const pacote = require('pacote')
const Arborist = require('../../index.js')
const url = require('url')
const mkdirp = require('mkdirp')
const {dirname, resolve} = require('path')
const {writeFileSync} = require('fs')
const dir = resolve(__dirname, 'content')
const nm = /^.*node_modules\/(@[^\/]+\/[^\/]+|[^@\/][^\/]*)$/
const main = async lock => {
  for (const [loc, meta] of Object.entries(lock.packages)) {
    if (!loc || meta.link || !nm.test(loc))
      continue

    const name = meta.name || loc.replace(nm, '$1')

    console.error('FETCHING', name)

    const paku = await pacote.packument(name, { fullMetadata: true })
    const saveTo = resolve(dir, name.replace(/^@/, '') + '.json')
    mkdirp.sync(dirname(saveTo))
    writeFileSync(saveTo, JSON.stringify(paku, 0, 2))

    const corgi = await pacote.packument(name, {})
    const corgiSaveTo = resolve(dir, name.replace(/^@/, '') + '.min.json')
    writeFileSync(corgiSaveTo, JSON.stringify(corgi, 0, 2))

    // bundled deps sometimes don't have a resolved value
    if (!meta.resolved)
      continue
    const path = url.parse(meta.resolved).pathname.replace(/^\/@?/, '')
    const tgzFile = resolve(dir, path)
    await pacote.tarball.file(meta.resolved, tgzFile, { Arborist })
  }
  console.log('OK!')
}

main(require(resolve(process.argv[2])))
