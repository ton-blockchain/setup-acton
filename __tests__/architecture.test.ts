import process from "node:process"
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import type * as architectureModule from "@/artifact/architecture"
import type { Architecture } from "@/artifact/architecture"

type ArchitectureModule = typeof architectureModule

const debugMock = jest.fn<(message: string) => void>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    debug: debugMock,
  }
})

const { resolveArchitecture } = (await import("@/artifact/architecture")) as ArchitectureModule

const originalArchitectureDescriptor = Object.getOwnPropertyDescriptor(process, "arch")
if (originalArchitectureDescriptor === undefined) {
  throw new Error("process.arch descriptor not found")
}

function mockProcessArchitecture(architecture: string): void {
  Object.defineProperty(process, "arch", {
    ...originalArchitectureDescriptor,
    value: architecture,
  })
}

const detectedArchitectureCases: ReadonlyArray<{
  readonly processArchitecture: string
  readonly expectedArchitecture: Architecture
}> = [
  {
    processArchitecture: "x64",
    expectedArchitecture: "x86_64",
  },
  {
    processArchitecture: "arm64",
    expectedArchitecture: "aarch64",
  },
]

describe("resolveArchitecture", (): void => {
  beforeEach((): void => {
    debugMock.mockReset()
  })

  afterEach((): void => {
    Object.defineProperty(process, "arch", originalArchitectureDescriptor)
  })

  it.each([
    "x86_64",
    "aarch64",
  ] as const)("returns explicit architecture %s without process detection", (architecture): void => {
    mockProcessArchitecture("ia32")

    expect(resolveArchitecture(architecture)).toBe(architecture)
    expect(debugMock).not.toHaveBeenCalled()
  })

  it.each(detectedArchitectureCases)("maps process.arch $processArchitecture to $expectedArchitecture", ({
    processArchitecture,
    expectedArchitecture,
  }): void => {
    mockProcessArchitecture(processArchitecture)

    expect(resolveArchitecture("")).toBe(expectedArchitecture)
    expect(debugMock).toHaveBeenCalledWith(`Detected architecture: ${processArchitecture}`)
  })

  it("throws for unsupported detected architecture", (): void => {
    mockProcessArchitecture("ia32")

    expect((): Architecture => resolveArchitecture("")).toThrow("Unsupported architecture: ia32")
    expect(debugMock).toHaveBeenCalledWith("Detected architecture: ia32")
  })
})
