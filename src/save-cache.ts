import * as core from "@actions/core"
import { Cache } from "@/cache/cache"
import * as inputs from "@/utils/inputs"

async function run(): Promise<void> {
  const inputSaveCache = inputs.saveCacheInput()
  const inputVersion = inputs.versionInput

  const cache = new Cache(inputSaveCache)
  if (!cache.saveCache) {
    core.debug("Cache save is disabled. Skipping cache save step.")
    return
  }

  if (inputVersion === "trunk") {
    core.info("Skipping cache save for trunk version")
    return
  }

  core.debug(`Saving cache for version ${inputVersion}`)
  await cache.save()
}

async function main(): Promise<void> {
  core.debug("Start save-cache")

  try {
    await run()
  } catch (error: unknown) {
    const message = error instanceof Error ? error : String(error)
    core.setFailed(message)
  }
}

await main()
