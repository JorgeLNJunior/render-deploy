import { execSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { GitService } from '../src/git.service.js'

const service = new GitService()
const testingBranch = 'testing'

describe('GitService', () => {
  describe('isValidRef', () => {
    test.each(['a2e3b2fe86780e136010ec10461d44df5a9c0736', 'main', 'v1.1.0'])(
      'should return true if a git ref is valid',
      (ref) => {
        expect(service.isValidRef(ref)).toBe(true)
      },
    )

    test.each([
      '3a21d3d2b9478ecfef3463254e44a0410267f520',
      'invalid-branch',
      'v0.5.1',
    ])('should return false if a git ref is not valid', (ref) => {
      const isValidRef = service.isValidRef(ref)
      expect(isValidRef).toBe(false)
    })
  })

  describe('resolveRefHash', () => {
    test.each([
      ['v1.4.2', '735620f0917024cb111b67c98187717eb26b50d1'],
      [
        '2aa79f2a31d79de0a0ecb4413eec9142f47a8b4f',
        '2aa79f2a31d79de0a0ecb4413eec9142f47a8b4f',
      ],
      [testingBranch, createTestingBranch()],
    ])(
      'should return the commit hash associated with given ref',
      (input, output) => {
        expect(service.resolveRefHash(input)).toBe(output)
      },
    )
  })
})

function createTestingBranch(): string {
  execSync(`git branch -f ${testingBranch}`)
  return service.resolveRefHash(testingBranch)
}
