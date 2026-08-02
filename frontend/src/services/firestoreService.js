import { db } from '../firebase'
import { collection, addDoc, getDocs, getDoc, query, where, orderBy, limit, serverTimestamp, doc, setDoc } from 'firebase/firestore'

// Save user query and AI response to history
export async function saveQueryHistory(uid, questionText, answerText, sources) {
  const item = {
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    uid: uid || 'anonymous',
    question: questionText,
    answer: answerText,
    sources: sources || [],
    timestamp: new Date().toISOString()
  }

  // Dual-write to localStorage for instant offline/offline demo persistence
  try {
    const key = `nexusiq_queries_${uid || 'anon'}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = [item, ...existing.filter(q => q.question !== questionText)].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (e) {
    console.error('LocalStorage query save error:', e)
  }

  if (!uid) return
  try {
    await addDoc(collection(db, 'query_history'), {
      uid,
      question: questionText,
      answer: answerText,
      sources: sources || [],
      timestamp: serverTimestamp()
    })
  } catch (e) {
    console.warn('Firestore query save fallback to local:', e)
  }
}

// Retrieve recent query history for user
export async function getQueryHistory(uid, max = 20) {
  const targetUid = uid || 'anon'
  let localItems = []
  try {
    localItems = JSON.parse(localStorage.getItem(`nexusiq_queries_${targetUid}`) || '[]')
  } catch (e) {}

  if (!uid) return localItems.slice(0, max)

  try {
    const q = query(
      collection(db, 'query_history'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(max)
    )
    const snap = await getDocs(q)
    const remoteItems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (remoteItems.length > 0) return remoteItems
  } catch (e) {
    console.warn('Firestore index or query unavailable, using local history fallback:', e)
  }
  return localItems.slice(0, max)
}

// Log document upload activity
export async function saveUploadRecord(uid, filename, type, entitiesFound, relationshipsFound) {
  const item = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    uid: uid || 'anonymous',
    filename,
    type,
    entitiesFound,
    relationshipsFound,
    timestamp: new Date().toISOString()
  }

  // Dual-write to localStorage
  try {
    const key = `nexusiq_uploads_${uid || 'anon'}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = [item, ...existing.filter(u => u.filename !== filename)].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (e) {
    console.error('LocalStorage upload save error:', e)
  }

  if (!uid) return
  try {
    await addDoc(collection(db, 'upload_history'), {
      uid,
      filename,
      type,
      entitiesFound,
      relationshipsFound,
      timestamp: serverTimestamp()
    })
  } catch (e) {
    console.warn('Firestore upload save fallback to local:', e)
  }
}

// Retrieve recent uploads for user
export async function getUploadHistory(uid, max = 50) {
  const targetUid = uid || 'anon'
  let localItems = []
  try {
    localItems = JSON.parse(localStorage.getItem(`nexusiq_uploads_${targetUid}`) || '[]')
  } catch (e) {}

  if (!uid) return localItems.slice(0, max)

  try {
    const q = query(
      collection(db, 'upload_history'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(max)
    )
    const snap = await getDocs(q)
    const remoteItems = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (remoteItems.length > 0) return remoteItems
  } catch (e) {
    console.warn('Firestore upload history index unavailable, using local fallback:', e)
  }
  return localItems.slice(0, max)
}

// Clear user history
export function clearUserHistory(uid) {
  const targetUid = uid || 'anon'
  try {
    localStorage.removeItem(`nexusiq_queries_${targetUid}`)
    localStorage.removeItem(`nexusiq_uploads_${targetUid}`)
  } catch (e) {}
}

// Update user profile data
export async function saveUserProfile(uid, email, role) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      role,
      lastLogin: serverTimestamp()
    }, { merge: true })
  } catch (e) {
    console.error('failed to save profile:', e)
  }
}

// Record active subscription status
export async function saveSubscription(uid, plan, paymentId, orderId) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'subscriptions', uid), {
      plan,
      paymentId,
      orderId,
      status: 'active',
      subscribedAt: serverTimestamp(),
      expiresAt: null
    }, { merge: true })
  } catch (e) {
    console.error('failed to save subscription:', e)
  }
}

// Verify user subscription status
export async function getSubscription(uid) {
  if (!uid) return null
  try {
    const docSnap = await getDoc(doc(db, 'subscriptions', uid))
    if (docSnap.exists()) return docSnap.data()
    return null
  } catch (e) {
    console.error('failed to get subscription:', e)
    return null
  }
}
