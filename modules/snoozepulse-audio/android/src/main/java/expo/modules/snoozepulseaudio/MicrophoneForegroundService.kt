package expo.modules.snoozepulseaudio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/**
 * Microphone foreground service required on Android 14+ while AudioRecord is active.
 * Started from [CaptureEngine.start] while the app is still foregrounded (Task 5.2).
 */
class MicrophoneForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    ensureChannel()
    val notification: Notification =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(this, CHANNEL_ID)
          .setContentTitle("SnoozePulse")
          .setContentText("Recording sleep session")
          .setSmallIcon(android.R.drawable.ic_btn_speak_now)
          .setOngoing(true)
          .build()
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(this)
          .setContentTitle("SnoozePulse")
          .setContentText("Recording sleep session")
          .setSmallIcon(android.R.drawable.ic_btn_speak_now)
          .setOngoing(true)
          .build()
      }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    return START_NOT_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    // User swiped the app away mid-session — do not leave a sticky mic FGS behind.
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    super.onDestroy()
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = getSystemService(NotificationManager::class.java)
    val channel =
      NotificationChannel(
        CHANNEL_ID,
        "Sleep recording",
        NotificationManager.IMPORTANCE_LOW,
      )
    manager.createNotificationChannel(channel)
  }

  companion object {
    private const val CHANNEL_ID = "snoozepulse_mic"
    private const val NOTIFICATION_ID = 4401
  }
}
