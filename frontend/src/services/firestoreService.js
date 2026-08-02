import { db } from '../firebase'
import { collection, addDoc, getDocs, getDoc, query, where, orderBy, limit, serverTimestamp, doc, setDoc } from 'firebase/firestore'

// Save user query and AI response to history
export async function saveQueryHistory(uid, questionText, answerText, sources) {
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
    console.error('failed to save query:', e)
  }
}

// Retrieve recent query history for user
export async function getQueryHistory(uid, max = 20) {
  if (!uid) return []
  try {
    const q = query(
      collection(db, 'query_history'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(max)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('failed to load history:', e)
    return []
  }
}

// Log document upload activity
export async function saveUploadRecord(uid, filename, type, entitiesFound, relationshipsFound) {
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
    console.error('failed to save upload:', e)
  }
}

// Retrieve recent uploads for user
export async function getUploadHistory(uid, max = 50) {
  if (!uid) return []
  try {
    const q = query(
      collection(db, 'upload_history'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(max)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('failed to load uploads:', e)
    return []
  }
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
    const snap = await getDocs(query(collection(db, 'subscriptions'), where('uid', '==', uid)))
    const docSnap = await getDoc(doc(db, 'subscriptions', uid))
    if (docSnap.exists()) return docSnap.data()
    return null
  } catch (e) {
    console.error('failed to get subscription:', e)
    return null
  }
}
