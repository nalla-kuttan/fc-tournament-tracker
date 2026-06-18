import AppKit
import Darwin
import Foundation

@MainActor
final class NextServerManager: ObservableObject {
    enum State: Equatable {
        case idle
        case starting
        case running
        case failed
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var statusMessage = "Checking the local Next.js app."

    let port: Int
    let webRoot: URL

    private var process: Process?

    var appURL: URL {
        URL(string: "http://127.0.0.1:\(port)")!
    }

    init(
        preferredPort: Int = Int(ProcessInfo.processInfo.environment["INNER_CELESTIAL_PORT"] ?? "") ?? 3000,
        webRoot: URL = ProjectLocator.findWebRoot()
    ) {
        self.port = PortResolver.availablePort(startingAt: preferredPort)
        self.webRoot = webRoot
    }

    deinit {
        process?.terminate()
    }

    func start() async {
        guard state != .starting && state != .running else { return }

        state = .starting
        statusMessage = "Starting Inner Celestial on port \(port)."

        do {
            try launchNextServer()
            statusMessage = "Starting Next.js from \(webRoot.lastPathComponent)."

            if await waitForServer(timeout: 45) {
                state = .running
                statusMessage = "Inner Celestial is running."
            } else {
                state = .failed
                statusMessage = "The Next.js server did not respond on port \(port). Try running npm install, then reopen the app."
            }
        } catch {
            state = .failed
            statusMessage = error.localizedDescription
        }
    }

    func restart() async {
        process?.terminate()
        process = nil
        state = .idle
        await start()
    }

    private func launchNextServer() throws {
        let packageJSON = webRoot.appendingPathComponent("package.json")
        guard FileManager.default.fileExists(atPath: packageJSON.path) else {
            throw ServerError.missingProject(webRoot.path)
        }

        let process = Process()
        process.currentDirectoryURL = webRoot
        process.executableURL = URL(fileURLWithPath: "/bin/zsh")
        process.arguments = [
            "-lc",
            serverCommand
        ]
        process.environment = ProcessInfo.processInfo.environment.merging([
            "BROWSER": "none"
        ]) { current, _ in current }

        try process.run()
        self.process = process
    }

    private var serverCommand: String {
        let logPath = FileManager.default
            .homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Logs/InnerCelestialMac-next.log")
            .path
            .shellEscaped

        return """
        export NVM_DIR="$HOME/.nvm"; \
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; \
        cd \(webRoot.path.shellEscaped) && \
        npm run dev -- --hostname 127.0.0.1 --port \(port) >> \(logPath) 2>&1
        """
    }

    private nonisolated func waitForServer(timeout: TimeInterval) async -> Bool {
        let deadline = Date().addingTimeInterval(timeout)

        repeat {
            if await isServerReachable() {
                return true
            }

            try? await Task.sleep(nanoseconds: 350_000_000)
        } while Date() < deadline

        return false
    }

    private nonisolated func isServerReachable() async -> Bool {
        var request = URLRequest(url: URL(string: "http://127.0.0.1:\(port)")!)
        request.timeoutInterval = 1

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else { return false }
            return (200..<500).contains(httpResponse.statusCode)
        } catch {
            return false
        }
    }
}

private enum PortResolver {
    static func availablePort(startingAt preferredPort: Int) -> Int {
        for port in preferredPort..<(preferredPort + 100) {
            if isAvailable(port: port) {
                return port
            }
        }

        return preferredPort
    }

    private static func isAvailable(port: Int) -> Bool {
        let socketDescriptor = socket(AF_INET, SOCK_STREAM, 0)
        guard socketDescriptor >= 0 else { return false }
        defer { close(socketDescriptor) }

        var reuse = 1
        setsockopt(socketDescriptor, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int>.size))

        var address = sockaddr_in()
        address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        address.sin_family = sa_family_t(AF_INET)
        address.sin_port = UInt16(port).bigEndian
        address.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))

        return withUnsafePointer(to: &address) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { socketAddress in
                bind(socketDescriptor, socketAddress, socklen_t(MemoryLayout<sockaddr_in>.size)) == 0
            }
        }
    }
}

private extension String {
    var shellEscaped: String {
        "'\(replacingOccurrences(of: "'", with: "'\\''"))'"
    }
}

private enum ServerError: LocalizedError {
    case missingProject(String)

    var errorDescription: String? {
        switch self {
        case .missingProject(let path):
            "Could not find package.json at \(path). Set INNER_CELESTIAL_WEB_ROOT to the web project folder."
        }
    }
}
