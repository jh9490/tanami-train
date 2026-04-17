package com.tanamitrain.cv

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions

class CVTranslationModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "CVTranslationModule"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun getAvailability(sourceLanguage: String, targetLanguage: String, promise: Promise) {
    val availability = Arguments.createMap()
    val sourceCode = TranslateLanguage.fromLanguageTag(sourceLanguage)
    val targetCode = TranslateLanguage.fromLanguageTag(targetLanguage)

    if (sourceCode == null || targetCode == null) {
      availability.putBoolean("supported", false)
      availability.putString("reason", "language_unsupported")
      availability.putString("message", "الزوج اللغوي المطلوب غير مدعوم محلياً على هذا الجهاز.")
      promise.resolve(availability)
      return
    }

    availability.putBoolean("supported", true)
    promise.resolve(availability)
  }

  @ReactMethod
  fun translateBatch(texts: ReadableArray, sourceLanguage: String, targetLanguage: String, promise: Promise) {
    val sourceCode = TranslateLanguage.fromLanguageTag(sourceLanguage)
    val targetCode = TranslateLanguage.fromLanguageTag(targetLanguage)

    if (sourceCode == null || targetCode == null) {
      promise.reject("language_unsupported", "Requested translation language is not supported on this device.")
      return
    }

    val values = buildList {
      for (index in 0 until texts.size()) {
        add(texts.getString(index) ?: "")
      }
    }

    val translator = createTranslator(sourceCode, targetCode)

    translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
      .addOnSuccessListener {
        val translationTasks = values.map { value ->
          if (value.isBlank()) {
            Tasks.forResult(value)
          } else {
            translator.translate(value)
          }
        }

        Tasks.whenAllSuccess<String>(translationTasks)
          .addOnSuccessListener { translatedValues ->
            val payload = Arguments.createArray()

            translatedValues.forEach { item ->
              payload.pushString(item.toString())
            }

            translator.close()
            promise.resolve(payload)
          }
          .addOnFailureListener { error ->
            translator.close()
            promise.reject("translation_failed", "Failed to translate CV text on-device.", error)
          }
      }
      .addOnFailureListener { error ->
        translator.close()
        promise.reject("translation_download_failed", "Failed to prepare the local translation model.", error)
      }
  }

  private fun createTranslator(sourceCode: String, targetCode: String): Translator {
    val options = TranslatorOptions.Builder()
      .setSourceLanguage(sourceCode)
      .setTargetLanguage(targetCode)
      .build()

    return Translation.getClient(options)
  }
}
