import 'dart:io';
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_client.dart';

class UploadService {
  final Dio _dio = ApiClient().dio;

  /// Upload payment proof image
  Future<String> uploadPaymentProof(File file) async {
    return _uploadFile(ApiConfig.uploadPayment, file);
  }

  /// Upload condition photo
  Future<String> uploadPhoto(File file) async {
    return _uploadFile(ApiConfig.uploadPhoto, file);
  }

  /// Upload generic document
  Future<String> uploadDocument(File file) async {
    return _uploadFile(ApiConfig.uploadDocument, file);
  }

  /// Upload multiple photos (max 5)
  Future<List<String>> uploadMultiplePhotos(List<File> files) async {
    final formData = FormData();
    for (final file in files) {
      formData.files.add(
        MapEntry(
          'files',
          await MultipartFile.fromFile(
            file.path,
            filename: file.path.split('/').last,
          ),
        ),
      );
    }

    final response = await _dio.post(
      ApiConfig.uploadPhotos,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    final List urls = response.data['data']['urls'] ?? [];
    return urls.cast<String>();
  }

  /// Internal helper: upload a single file
  Future<String> _uploadFile(String endpoint, File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
    });

    final response = await _dio.post(
      endpoint,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return response.data['data']['url'] ?? '';
  }
}
