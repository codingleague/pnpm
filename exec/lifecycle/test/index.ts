/// <reference path="../../../__typings__/index.d.ts"/>
import path from 'path'
import { runLifecycleHook, runPostinstallHooks } from '@pnpm/lifecycle'
import loadJsonFile from 'load-json-file'
import rimraf from '@zkochan/rimraf'
import { PnpmError } from '@pnpm/error'
import { fixtures } from '@pnpm/test-fixtures'

const f = fixtures(path.join(__dirname, 'fixtures'))
const rootModulesDir = path.join(__dirname, '..', 'node_modules')

test('runLifecycleHook()', async () => {
  const pkgRoot = f.find('simple')
  const pkg = await import(path.join(pkgRoot, 'package.json'))
  await runLifecycleHook('postinstall', pkg, {
    depPath: '/simple/1.0.0',
    optional: false,
    pkgRoot,
    rawConfig: {},
    rootModulesDir,
    unsafePerm: true,
  })

  expect((await import(path.join(pkgRoot, 'output.json'))).default).toStrictEqual(['install'])
})

test('runLifecycleHook() escapes the args passed to the script', async () => {
  const pkgRoot = f.find('escape-args')
  const pkg = await import(path.join(pkgRoot, 'package.json'))
  await runLifecycleHook('echo', pkg, {
    depPath: '/escape-args/1.0.0',
    pkgRoot,
    rawConfig: {},
    rootModulesDir,
    unsafePerm: true,
    args: ['Revert "feature (#1)"'],
  })

  expect((await import(path.join(pkgRoot, 'output.json'))).default).toStrictEqual(['Revert "feature (#1)"'])
})

test('runLifecycleHook() sets frozen-lockfile to false', async () => {
  const pkgRoot = f.find('inspect-frozen-lockfile')
  const pkg = await import(path.join(pkgRoot, 'package.json'))
  await runLifecycleHook('postinstall', pkg, {
    depPath: '/inspect-frozen-lockfile/1.0.0',
    pkgRoot,
    rawConfig: {
      'frozen-lockfile': true,
    },
    rootModulesDir,
    unsafePerm: true,
  })

  expect((await import(path.join(pkgRoot, 'output.json'))).default).toStrictEqual(['empty string'])
})

test('runPostinstallHooks()', async () => {
  const pkgRoot = f.find('with-many-scripts')
  await rimraf(path.join(pkgRoot, 'output.json'))
  await runPostinstallHooks({
    depPath: '/with-many-scripts/1.0.0',
    optional: false,
    pkgRoot,
    rawConfig: {},
    rootModulesDir,
    unsafePerm: true,
  })

  expect(loadJsonFile.sync(path.join(pkgRoot, 'output.json'))).toStrictEqual(['preinstall', 'install', 'postinstall'])
})

test('runLifecycleHook() should throw an error while missing script start or file server.js', async () => {
  const pkgRoot = f.find('without-scriptstart-serverjs')
  const pkg = await import(path.join(pkgRoot, 'package.json'))
  await expect(
    runLifecycleHook('start', pkg, {
      depPath: '/without-scriptstart-serverjs/1.0.0',
      optional: false,
      pkgRoot,
      rawConfig: {},
      rootModulesDir,
      unsafePerm: true,
    })
  ).rejects.toThrow(new PnpmError('NO_SCRIPT_OR_SERVER', 'Missing script start or file server.js'))
})
