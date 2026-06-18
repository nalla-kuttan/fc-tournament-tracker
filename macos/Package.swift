// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "InnerCelestialMac",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(
            name: "InnerCelestialMac",
            targets: ["InnerCelestialMac"]
        )
    ],
    targets: [
        .executableTarget(
            name: "InnerCelestialMac"
        )
    ]
)
