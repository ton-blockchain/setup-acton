import * as fs from "node:fs"
import process from "node:process"
import { remark } from "remark"

const releaseEntryPattern =
  /^\[(?<version>(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))\]\s*-\s*(?<date>\d{2}\.\d{2}\.\d{4})$/

const CHANGELOG_PATH = "CHANGELOG.md"

type ChangelogError = {
  readonly title: string
  readonly message: string
  readonly position?: number
}

type MarkdownNode = {
  readonly value: string
  readonly position: number
}

type ReleaseEntry = {
  readonly version: string
  readonly position: number
}

function dateIsValid(value: string): boolean {
  const [day, month, year] = value.split(".").map(Number)

  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function getPackageVersion(): string {
  const { version } = require("../package.json")
  return version
}

function checkChangelog(markdown: string): ChangelogError[] | undefined {
  const tree = remark().parse(markdown)

  const errors: ChangelogError[] = []

  const parsedNode: MarkdownNode[] = []
  for (const node of tree.children) {
    if (node.type !== "heading") {
      continue
    }

    if (node.depth !== 2) {
      continue
    }

    if (node.children.length !== 1) {
      errors.push({
        title: "Invalid changelog format",
        message: `Expected single text node for changelog entry, got ${node.children.length} child nodes`,
        position: node.position?.start.line,
      })
      continue
    }

    const [childrenNode] = node.children
    if (childrenNode.type !== "text") {
      errors.push({
        title: "Invalid changelog format",
        message: `Expected text node for changelog entry, got ${childrenNode.type}`,
        position: childrenNode.position?.start.line,
      })
      continue
    }

    parsedNode.push({
      value: childrenNode.value,
      position: childrenNode.position?.start.line ?? -1,
    })
  }

  let isSkippedUnrelease = false
  const releaseEntries: ReleaseEntry[] = []
  for (const node of parsedNode) {
    if (node.value === "[Unreleased]") {
      isSkippedUnrelease = true
      continue
    }

    const result = releaseEntryPattern.exec(node.value)
    if (result === null) {
      errors.push({
        title: "Invalid changelog format",
        message: `Expected release entry in format [version] - date, got ${node.value}`,
        position: node.position,
      })
      continue
    }

    const { date = "", version = "" } = result?.groups ?? {}

    if (!dateIsValid(date)) {
      errors.push({
        title: "Invalid date format",
        message: `Expected valid date format, got ${date}`,
        position: node.position,
      })
      continue
    }

    releaseEntries.push({ version, position: node.position })
  }

  const versions = releaseEntries.map((entry): string => entry.version)
  const duplicatedReleaseEntries = releaseEntries.filter(
    (entry, index): boolean => versions.indexOf(entry.version) !== index,
  )

  for (const entry of duplicatedReleaseEntries) {
    errors.push({
      title: "Invalid version format",
      message: `Duplicate changelog entry for version ${entry.version}`,
      position: entry.position,
    })
  }

  if (!isSkippedUnrelease) {
    errors.push({
      title: "Invalid changelog format",
      message: "Missing Unreleased changelog entry",
    })
  }

  const packageVersion = getPackageVersion()
  if (!versions.includes(packageVersion)) {
    errors.push({
      title: "Invalid version format",
      message: `Missing changelog entry for current version ${packageVersion}`,
    })
  }

  return errors.length > 0 ? errors : undefined
}

function reportGitHubError(error: ChangelogError): void {
  let message = `::error file=${CHANGELOG_PATH},title=${error.title}`

  if (error.position === undefined) {
    message += ",line=1,col=0"
  } else {
    message += `,line=${error.position},col=0`
  }

  message += `::${error.message}`

  process.stderr.write(`${message}\n`)
}

function main(): void {
  const markdown = fs.readFileSync(CHANGELOG_PATH, "utf8")

  const errors = checkChangelog(markdown)
  if (errors !== undefined) {
    for (const error of errors) {
      reportGitHubError(error)
    }
    process.exit(1)
  }
}

main()
