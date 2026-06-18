import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var serverManager: NextServerManager
    @State private var webViewIdentity = UUID()

    var body: some View {
        ZStack {
            WebView(url: serverManager.appURL)
                .id(webViewIdentity)

            if serverManager.state != .running {
                LaunchOverlay(
                    state: serverManager.state,
                    message: serverManager.statusMessage,
                    retry: {
                        Task { await serverManager.restart() }
                    }
                )
            }
        }
        .frame(minWidth: 1120, minHeight: 740)
        .toolbar {
            ToolbarItemGroup {
                Button {
                    webViewIdentity = UUID()
                } label: {
                    Label("Reload", systemImage: "arrow.clockwise")
                }
                .help("Reload")

                Button {
                    NSWorkspace.shared.open(serverManager.appURL)
                } label: {
                    Label("Open in Browser", systemImage: "safari")
                }
                .help("Open in Browser")
            }
        }
    }
}

private struct LaunchOverlay: View {
    let state: NextServerManager.State
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            if state == .failed {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 34))
                    .foregroundStyle(.orange)
            } else {
                ProgressView()
                    .controlSize(.large)
            }

            Text(title)
                .font(.title3.weight(.semibold))

            Text(message)
                .font(.callout)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 420)

            if state == .failed {
                Button("Try Again", action: retry)
                    .keyboardShortcut(.defaultAction)
            }
        }
        .padding(28)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 8))
        .shadow(radius: 18)
    }

    private var title: String {
        switch state {
        case .idle:
            "Preparing Inner Celestial"
        case .starting:
            "Starting Inner Celestial"
        case .running:
            "Inner Celestial is Ready"
        case .failed:
            "Inner Celestial Could Not Start"
        }
    }
}
