import Foundation

enum ProjectLocator {
    static func findWebRoot() -> URL {
        if let explicitPath = ProcessInfo.processInfo.environment["INNER_CELESTIAL_WEB_ROOT"], !explicitPath.isEmpty {
            return URL(fileURLWithPath: explicitPath).standardizedFileURL
        }

        if let bundledRoot = readBundledWebRoot() {
            return bundledRoot
        }

        let currentDirectory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        let sourceDirectory = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let candidates = [
            currentDirectory,
            currentDirectory.deletingLastPathComponent(),
            Bundle.main.bundleURL.deletingLastPathComponent(),
            Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent(),
            sourceDirectory
        ]

        for candidate in candidates {
            if FileManager.default.fileExists(atPath: candidate.appendingPathComponent("package.json").path) {
                return candidate.standardizedFileURL
            }
        }

        return currentDirectory.standardizedFileURL
    }

    private static func readBundledWebRoot() -> URL? {
        guard let resourceURL = Bundle.main.url(forResource: "WebRootPath", withExtension: "txt"),
              let path = try? String(contentsOf: resourceURL, encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines),
              !path.isEmpty
        else {
            return nil
        }

        let url = URL(fileURLWithPath: path).standardizedFileURL
        let packageJSON = url.appendingPathComponent("package.json")
        return FileManager.default.fileExists(atPath: packageJSON.path) ? url : nil
    }
}
