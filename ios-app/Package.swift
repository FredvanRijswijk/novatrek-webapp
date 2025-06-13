// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NovaTrek",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "NovaTrekCore",
            targets: ["NovaTrekCore"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "11.15.0"),
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.10.0"),
    ],
    targets: [
        .target(
            name: "NovaTrekCore",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk"),
                "Alamofire",
                "Kingfisher"
            ]
        ),
        .testTarget(
            name: "NovaTrekCoreTests",
            dependencies: ["NovaTrekCore"]
        ),
    ]
)