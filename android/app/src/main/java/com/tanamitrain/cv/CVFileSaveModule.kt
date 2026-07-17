package com.tanamitrain.cv

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class CVFileSaveModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "CVFileSaveModule"
    private const val DOWNLOAD_SUBDIRECTORY = "TanamiTrain"
    private const val PDF_MIME_TYPE = "application/pdf"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun savePdfToDownloads(sourcePath: String, fileName: String, promise: Promise) {
    val normalizedSourcePath = sourcePath.removePrefix("file://").trim()
    if (normalizedSourcePath.isBlank()) {
      promise.reject("missing_source_path", "Missing source file path for CV save.")
      return
    }

    val sourceFile = File(normalizedSourcePath)
    if (!sourceFile.exists()) {
      promise.reject("source_missing", "Generated CV file does not exist.")
      return
    }

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        promise.resolve(saveWithMediaStore(sourceFile, fileName))
      } else {
        promise.resolve(saveToLegacyDownloads(sourceFile, fileName))
      }
    } catch (error: Exception) {
      promise.reject("save_failed", "Failed to save CV to device storage.", error)
    }
  }

  private fun saveWithMediaStore(sourceFile: File, fileName: String) =
    Arguments.createMap().apply {
    val resolver = reactContext.contentResolver
    val relativePath = "${Environment.DIRECTORY_DOWNLOADS}/$DOWNLOAD_SUBDIRECTORY"
    val values = ContentValues().apply {
      put(MediaStore.Downloads.DISPLAY_NAME, ensurePdfFileName(fileName))
      put(MediaStore.Downloads.MIME_TYPE, PDF_MIME_TYPE)
      put(MediaStore.Downloads.RELATIVE_PATH, relativePath)
      put(MediaStore.Downloads.IS_PENDING, 1)
    }

    val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val destinationUri = resolver.insert(collection, values)
      ?: throw IOException("Failed to create destination entry in MediaStore.")

    try {
      FileInputStream(sourceFile).use { input ->
        resolver.openOutputStream(destinationUri)?.use { output ->
          input.copyTo(output)
        } ?: throw IOException("Failed to open destination output stream.")
      }

      values.clear()
      values.put(MediaStore.Downloads.IS_PENDING, 0)
      resolver.update(destinationUri, values, null, null)

      putString("destination", destinationUri.toString())
      putString("label", "Downloads/$DOWNLOAD_SUBDIRECTORY/${ensurePdfFileName(fileName)}")
    } catch (error: Exception) {
      resolver.delete(destinationUri, null, null)
      throw error
    }
  }

  private fun saveToLegacyDownloads(sourceFile: File, fileName: String) =
    Arguments.createMap().apply {
    val downloadsRoot = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
    val destinationDirectory = File(downloadsRoot, DOWNLOAD_SUBDIRECTORY)

    if (!destinationDirectory.exists()) {
      destinationDirectory.mkdirs()
    }

    val destinationFile = buildAvailableFile(destinationDirectory, ensurePdfFileName(fileName))
    FileInputStream(sourceFile).use { input ->
      destinationFile.outputStream().use { output ->
        input.copyTo(output)
      }
    }

    putString("destination", destinationFile.absolutePath)
    putString("label", "Downloads/$DOWNLOAD_SUBDIRECTORY/${destinationFile.name}")
  }

  private fun ensurePdfFileName(fileName: String): String {
    return if (fileName.lowercase().endsWith(".pdf")) fileName else "$fileName.pdf"
  }

  private fun buildAvailableFile(directory: File, preferredName: String): File {
    val dotIndex = preferredName.lastIndexOf('.')
    val baseName = if (dotIndex >= 0) preferredName.substring(0, dotIndex) else preferredName
    val extension = if (dotIndex >= 0) preferredName.substring(dotIndex) else ""

    var attempt = 0
    var candidate = File(directory, preferredName)

    while (candidate.exists()) {
      attempt += 1
      candidate = File(directory, "$baseName-$attempt$extension")
    }

    return candidate
  }
}
