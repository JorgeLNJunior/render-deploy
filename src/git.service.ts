import { execFileSync } from 'node:child_process'

/**
 * Service for interacting with Git repositories.
 * Provides methods to validate references and retrieve commit information.
 */
export class GitService {
  private git(args: string[]): string {
    return execFileSync('git', args, { encoding: 'utf-8' }).trim()
  }
  /**
   * Checks if the provided reference is a valid Git reference (commit, branch, or tag).
   *
   * @param ref - The Git reference to validate.
   * @returns `true` if the reference is valid, `false` otherwise.
   */
  isValidRef(ref: string): boolean {
    try {
      this.git(['rev-parse', '--verify', `${ref}^{commit}`])
    } catch {
      return false
    }
    return true
  }

  /**
   * Resolves the full commit hash for a given Git reference.
   *
   * @param ref - The Git reference (branch, tag, or commit hash) to resolve.
   * @returns The 40-character commit hash.
   * @throws If the reference cannot be resolved.
   */
  resolveRefHash(ref: string): string {
    try {
      return this.git(['rev-parse', `${ref}^{commit}`])
    } catch (error) {
      throw new Error(`could not get the commit hash of '${ref}' ref: ${error}`)
    }
  }
}
