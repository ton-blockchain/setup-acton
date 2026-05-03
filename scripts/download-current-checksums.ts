import * as fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { getOctokit } from "@actions/github"
import { parseChecksum } from "@/download/checksum"
import { KNOWN_CHECKSUMS } from "@/download/known-checksums"
import { OWNER, REPO } from "@/utils/constants"

const OUTPUT_PATH = "src/download/known-checksums.ts"
const ARCHIVE_SUFFIX = ".tar.gz"
const CHECKSUM_SUFFIX = ".sha256"

type GitHub = ReturnType<typeof getOctokit>
type Release = Awaited<ReturnType<GitHub["rest"]["repos"]["listReleases"]>>["data"][number]
type ReleaseAsset = Release["assets"][number]

type ChecksumManifest = Record<string, string>
type ChecksumChange = {
  readonly key: string
  readonly previousChecksum: string
  readonly currentChecksum?: string
}

function getGitHubToken(): string {
  const token = process.env.GH_TOKEN
  if (token === undefined || token === "") {
    throw new Error("GH_TOKEN environment variable is required")
  }

  return token
}

function isPublishedStableRelease(release: Release): boolean {
  return !(release.draft || release.prerelease) && release.published_at !== null && !release.tag_name.includes("trunk")
}

async function getReleases(octokit: GitHub): Promise<readonly Release[]> {
  const releases: Release[] = []
  const perPage = 100
  let page = 1

  while (true) {
    console.log(`Fetching releases page ${page}`)

    const response = await octokit.rest.repos.listReleases({
      owner: OWNER,
      repo: REPO,
      per_page: perPage,
      page,
    })

    const releasePage = response.data
    releases.push(...releasePage)
    console.log(`Fetched ${releasePage.length} releases from page ${page}`)

    if (releasePage.length < perPage) {
      const publishedStableReleases = releases.filter(isPublishedStableRelease)
      console.log(
        `Using ${publishedStableReleases.length} published stable releases out of ${releases.length} releases`,
      )
      return publishedStableReleases
    }

    page += 1
  }
}

async function downloadAssetText(octokit: GitHub, asset: ReleaseAsset): Promise<string> {
  const response = await octokit.rest.repos.getReleaseAsset({
    owner: OWNER,
    repo: REPO,
    asset_id: asset.id,
    headers: {
      accept: "application/octet-stream",
    },
  })

  const data = response.data as unknown
  if (typeof data === "string") {
    return data
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data)
  }

  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    return new TextDecoder().decode(bytes)
  }

  throw new Error(`Unexpected checksum file response for ${asset.name}`)
}

function isActonArchiveAsset(asset: ReleaseAsset): boolean {
  return asset.name.startsWith("acton-") && asset.name.endsWith(ARCHIVE_SUFFIX)
}

function createManifestKey(artifactName: string, version: string): string {
  const assetName = artifactName.slice(0, -ARCHIVE_SUFFIX.length)
  return `${assetName}-${version}`
}

function readKnownChecksumManifest(): ChecksumManifest {
  const manifest: ChecksumManifest = {}
  for (const [key, checksum] of Object.entries(KNOWN_CHECKSUMS)) {
    if (checksum === undefined) {
      continue
    }

    manifest[key] = checksum
  }

  return manifest
}

function formatKnownChecksumChange(change: ChecksumChange): string {
  const currentState =
    change.currentChecksum === undefined ? "missing after refresh" : `changed to ${change.currentChecksum}`

  return `- ${change.key}: was ${change.previousChecksum}, ${currentState}`
}

function assertKnownChecksumsUnchanged(
  previousManifest: Readonly<ChecksumManifest>,
  currentManifest: Readonly<ChecksumManifest>,
): void {
  const changes: ChecksumChange[] = []
  for (const [key, previousChecksum] of Object.entries(previousManifest)) {
    const currentChecksum = currentManifest[key]
    if (currentChecksum === previousChecksum) {
      continue
    }

    changes.push({ key, previousChecksum, currentChecksum })
  }

  if (changes.length === 0) {
    return
  }

  throw new Error(
    [
      "Known checksum manifest changed for existing entries.",
      "Refreshes may add new checksums, but existing checksums must stay unchanged.",
      ...changes.map(formatKnownChecksumChange),
    ].join("\n"),
  )
}

async function addReleaseChecksums(manifest: ChecksumManifest, octokit: GitHub, release: Release): Promise<void> {
  console.log(`Parsing release ${release.tag_name}`)
  const checksumAssets = new Map(
    release.assets.filter((asset) => asset.name.endsWith(CHECKSUM_SUFFIX)).map((asset) => [asset.name, asset]),
  )
  const artifactAssets = release.assets
    .filter(isActonArchiveAsset)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))

  for (const artifactAsset of artifactAssets) {
    const checksumAssetName = `${artifactAsset.name}${CHECKSUM_SUFFIX}`
    const checksumAsset = checksumAssets.get(checksumAssetName)
    if (checksumAsset === undefined) {
      console.log(`Skipping ${artifactAsset.name}: checksum file ${checksumAssetName} not found`)
      continue
    }

    console.log(`Downloading checksum ${checksumAsset.name}`)
    const checksumContents = await downloadAssetText(octokit, checksumAsset)
    console.log(`Parsing checksum ${checksumAsset.name}`)
    const { checksum, assetName } = parseChecksum(checksumContents)
    if (assetName !== artifactAsset.name) {
      throw new Error(`Checksum file name mismatch: expected ${artifactAsset.name}, got ${assetName}`)
    }

    manifest[createManifestKey(artifactAsset.name, release.tag_name)] = checksum
    console.log(`Parsed checksum for ${artifactAsset.name} in ${release.tag_name}`)
  }
}

async function createChecksumManifest(octokit: GitHub, releases: readonly Release[]): Promise<ChecksumManifest> {
  const manifest: ChecksumManifest = {}
  for (const release of releases) {
    await addReleaseChecksums(manifest, octokit, release)
    console.log()
  }
  return manifest
}

function createTypeScriptFileContents(manifest: ChecksumManifest): string {
  const sortedEntries = Object.entries(manifest).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  const checksumLines = sortedEntries.map(
    ([assetName, checksum]) => `  ${JSON.stringify(assetName)}: ${JSON.stringify(checksum)},`,
  )

  const lines = [
    "// This file is auto-generated by scripts/download-current-checksums.ts. Do not edit manually.",
    "export const KNOWN_CHECKSUMS: Readonly<Partial<Record<string, string>>> = {",
    ...checksumLines,
    "} as const",
    "",
  ]

  return lines.join("\n")
}

function writeTypeScriptFile(outputPath: string, manifest: ChecksumManifest): void {
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true })
  fs.writeFileSync(outputPath, createTypeScriptFileContents(manifest))
}

async function main(): Promise<void> {
  const knownManifest = readKnownChecksumManifest()
  const octokit = getOctokit(getGitHubToken())
  const releases = await getReleases(octokit)
  const manifest = await createChecksumManifest(octokit, releases)
  assertKnownChecksumsUnchanged(knownManifest, manifest)
  writeTypeScriptFile(OUTPUT_PATH, manifest)
  console.log(`Saved ${Object.keys(manifest).length} checksums from ${releases.length} releases to ${OUTPUT_PATH}`)
}

await main()
