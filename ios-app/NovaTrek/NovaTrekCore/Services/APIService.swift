import Foundation
import Alamofire
import FirebaseAuth

public class APIService {
    public static let shared = APIService()
    
    private let baseURL: String
    private let session: Session
    
    private init() {
        self.baseURL = Config.apiBaseURL
        
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        
        self.session = Session(configuration: configuration)
    }
    
    // MARK: - Authentication
    
    private func getAuthToken() async throws -> String {
        guard let user = Auth.auth().currentUser else {
            throw APIError.unauthorized
        }
        
        return try await user.getIDToken()
    }
    
    private func headers() async throws -> HTTPHeaders {
        let token = try await getAuthToken()
        return [
            "Authorization": "Bearer \(token)",
            "Content-Type": "application/json"
        ]
    }
    
    // MARK: - Generic Request Methods
    
    public func request<T: Decodable>(
        _ path: String,
        method: HTTPMethod = .get,
        parameters: Parameters? = nil,
        encoding: ParameterEncoding = JSONEncoding.default
    ) async throws -> T {
        let url = baseURL + path
        let headers = try await headers()
        
        return try await withCheckedThrowingContinuation { continuation in
            session.request(
                url,
                method: method,
                parameters: parameters,
                encoding: encoding,
                headers: headers
            )
            .validate()
            .responseDecodable(of: T.self, decoder: JSONDecoder.firebaseDecoder) { response in
                switch response.result {
                case .success(let value):
                    continuation.resume(returning: value)
                case .failure(let error):
                    continuation.resume(throwing: self.handleError(error, response: response.response))
                }
            }
        }
    }
    
    public func upload<T: Decodable>(
        _ path: String,
        data: Data,
        parameters: Parameters? = nil
    ) async throws -> T {
        let url = baseURL + path
        let headers = try await headers()
        
        return try await withCheckedThrowingContinuation { continuation in
            session.upload(
                multipartFormData: { multipartFormData in
                    multipartFormData.append(data, withName: "file", fileName: "upload.jpg", mimeType: "image/jpeg")
                    
                    if let parameters = parameters {
                        for (key, value) in parameters {
                            if let data = "\(value)".data(using: .utf8) {
                                multipartFormData.append(data, withName: key)
                            }
                        }
                    }
                },
                to: url,
                headers: headers
            )
            .validate()
            .responseDecodable(of: T.self, decoder: JSONDecoder.firebaseDecoder) { response in
                switch response.result {
                case .success(let value):
                    continuation.resume(returning: value)
                case .failure(let error):
                    continuation.resume(throwing: self.handleError(error, response: response.response))
                }
            }
        }
    }
    
    // MARK: - Error Handling
    
    private func handleError(_ error: AFError, response: HTTPURLResponse?) -> Error {
        if let statusCode = response?.statusCode {
            switch statusCode {
            case 401:
                return APIError.unauthorized
            case 403:
                return APIError.forbidden
            case 404:
                return APIError.notFound
            case 429:
                return APIError.rateLimited
            case 500...599:
                return APIError.serverError(statusCode)
            default:
                return APIError.networkError(error)
            }
        }
        
        return APIError.networkError(error)
    }
}

// MARK: - API Errors

public enum APIError: LocalizedError {
    case unauthorized
    case forbidden
    case notFound
    case rateLimited
    case serverError(Int)
    case networkError(Error)
    case decodingError(Error)
    case unknown
    
    public var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Please sign in to continue"
        case .forbidden:
            return "You don't have permission to access this resource"
        case .notFound:
            return "The requested resource was not found"
        case .rateLimited:
            return "Too many requests. Please try again later"
        case .serverError(let code):
            return "Server error (\(code)). Please try again"
        case .networkError(let error):
            return error.localizedDescription
        case .decodingError(let error):
            return "Failed to process response: \(error.localizedDescription)"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - JSON Decoder Extension

extension JSONDecoder {
    static var firebaseDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            
            // Try to decode as TimeInterval (Firebase Timestamp seconds)
            if let timeInterval = try? container.decode(TimeInterval.self) {
                return Date(timeIntervalSince1970: timeInterval)
            }
            
            // Try to decode as ISO8601 string
            if let dateString = try? container.decode(String.self) {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                if let date = formatter.date(from: dateString) {
                    return date
                }
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date")
        }
        return decoder
    }
}

