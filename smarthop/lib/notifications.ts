export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window
}

export async function requestPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(title: string, body: string, onClick?: () => void): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false
  }
  
  const n = new Notification(title, { body, icon: '/favicon.ico' })
  if (onClick) {
    n.onclick = () => { 
      onClick() 
      n.close() 
    }
  }

  return true
}
