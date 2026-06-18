import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var serverManager: NextServerManager

    var body: some View {
        Form {
            Section("Web App") {
                LabeledContent("Address") {
                    Text(serverManager.appURL.absoluteString)
                        .textSelection(.enabled)
                }

                LabeledContent("Project") {
                    Text(serverManager.webRoot.path)
                        .lineLimit(1)
                        .truncationMode(.middle)
                        .textSelection(.enabled)
                }
            }
        }
        .formStyle(.grouped)
        .padding(20)
        .frame(width: 520)
    }
}
