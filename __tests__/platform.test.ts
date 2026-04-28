import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"
import process from "node:process"
import type * as platformModule from "@/artifact/platform"
import type { Platform } from "@/artifact/platform"

type PlatformModule = typeof platformModule

const debugMock = jest.fn<(message: string) => void>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    debug: debugMock,
  }
})

const { resolvePlatform } = (await import("@/artifact/platform")) as PlatformModule

const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(process, "platform")
if (originalPlatformDescriptor === undefined) {
  throw new Error("process.platform descriptor not found")
}

function mockProcessPlatform(platform: string): void {
  Object.defineProperty(process, "platform", {
    ...originalPlatformDescriptor,
    value: platform,
  })
}

const detectedPlatformCases: ReadonlyArray<{
  readonly processPlatform: string
  readonly expectedPlatform: Platform
}> = [
  {
    processPlatform: "darwin",
    expectedPlatform: "apple",
  },
  {
    processPlatform: "win32",
    expectedPlatform: "windows",
  },
  {
    processPlatform: "linux",
    expectedPlatform: "linux",
  },
]

describe("resolvePlatform", (): void => {
  beforeEach((): void => {
    debugMock.mockReset()
  })

  afterEach((): void => {
    Object.defineProperty(process, "platform", originalPlatformDescriptor)
  })

  it.each(["linux", "apple", "windows"] as const)(
    "returns explicit platform %s without process detection",
    (platform): void => {
      mockProcessPlatform("freebsd")

      expect(resolvePlatform(platform)).toBe(platform)
      expect(debugMock).not.toHaveBeenCalled()
    },
  )

  it.each(detectedPlatformCases)(
    "maps process.platform $processPlatform to $expectedPlatform",
    ({ processPlatform, expectedPlatform }): void => {
      mockProcessPlatform(processPlatform)

      expect(resolvePlatform("")).toBe(expectedPlatform)
      expect(debugMock).toHaveBeenCalledWith(`Detected platform: ${processPlatform}`)
    },
  )

  it("throws for unsupported detected platform", (): void => {
    mockProcessPlatform("freebsd")

    expect((): Platform => resolvePlatform("")).toThrow("Unsupported platform: freebsd")
    expect(debugMock).toHaveBeenCalledWith("Detected platform: freebsd")
  })
})
