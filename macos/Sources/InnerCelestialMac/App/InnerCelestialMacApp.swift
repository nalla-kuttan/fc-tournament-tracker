import AppKit
import SwiftUI

@main
struct InnerCelestialMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var serverManager = NextServerManager()

    var body: some Scene {
        WindowGroup("Inner Celestial") {
            ContentView()
                .environmentObject(serverManager)
                .task {
                    await serverManager.start()
                }
        }
        .commands {
            CommandGroup(after: .appInfo) {
                Button("Open Web App in Browser") {
                    NSWorkspace.shared.open(serverManager.appURL)
                }
                .keyboardShortcut("b", modifiers: [.command, .shift])
            }
        }

        Settings {
            SettingsView()
                .environmentObject(serverManager)
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}
