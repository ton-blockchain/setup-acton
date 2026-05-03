import * as cache from "@actions/cache"
import * as core from "@actions/core"

const STATE_CACHE_KEY = "cache-key"
const STATE_CACHE_RESTORED_KEY = "cache-matched-key"
const STATE_CACHE_PATH = "cache-path"

export class Cache {
  public constructor(public readonly saveCache: boolean = false) {}

  public async save(): Promise<void> {
    const cacheKey = core.getState(STATE_CACHE_KEY)
    const restoredKey = core.getState(STATE_CACHE_RESTORED_KEY)
    const cachePath = core.getState(STATE_CACHE_PATH)

    if (cacheKey === restoredKey) {
      core.info(`Cache hit occurred on the key: ${cacheKey}, not saving cache.`)
      return
    }

    const cacheId = await cache.saveCache([cachePath], cacheKey)
    if (cacheId === -1) {
      core.warning(`Cache saved failed for key: ${cacheKey}`)
      return
    }

    core.debug(`Cache saved with ID: ${cacheId}`)
  }

  public async restore(cachePath: string, cacheKey: string): Promise<boolean> {
    core.debug(`Trying to restore cache for key=${cacheKey}, cachePath=${cachePath}`)
    const restoredKey = await cache.restoreCache([cachePath], cacheKey)

    core.saveState(STATE_CACHE_KEY, cacheKey)
    core.saveState(STATE_CACHE_PATH, cachePath)

    if (restoredKey !== undefined) {
      core.debug(`Cache restored for key: ${cacheKey}`)

      core.saveState(STATE_CACHE_RESTORED_KEY, restoredKey)
      return true
    }

    core.debug(`Cache not found for key: ${cacheKey}`)
    return false
  }
}
