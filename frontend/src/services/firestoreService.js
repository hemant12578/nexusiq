import { db } from '../firebase'
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, setDoc } from 'firebase/firestore'

// save a query + answer to user's history
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

// get user's recent queries
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

// save upload record
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

// get user's upload history
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

// save/update user profile on login
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

// Save subscription after successful payment
export async function saveSubscription(uid, plan, paymentId, orderId) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'subscriptions', uid), {
      plan,
      paymentId,
      orderId,
      status: 'active',
      subscribedAt: serverTimestamp(),
      expiresAt: null // TODO: add expiry logic
    }, { merge: true })
  } catch (e) {
    console.error('failed to save subscription:', e)
  }
}

// Check if user has active subscription
export async function getSubscription(uid) {
  if (!uid) return null
  try {
    const snap = await getDocs(query(collection(db, 'subscriptions'), where('uid', '==', uid)))
    // Actually use doc directly
    const { getDoc } = await import('firebase/firestore')
    const docSnap = await getDoc(doc(db, 'subscriptions', uid))
    if (docSnap.exists()) return docSnap.data()
    return null
  } catch (e) {
    console.error('failed to get subscription:', e)
    return null
  }
}
