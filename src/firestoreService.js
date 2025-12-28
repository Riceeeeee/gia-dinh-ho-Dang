// src/firestoreService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const MEMORIES_COLLECTION = 'memories';

/**
 * Load tất cả memories từ Firestore
 */
export const loadMemories = async () => {
  try {
    const memoriesRef = collection(db, MEMORIES_COLLECTION);
    // Sử dụng createdAt thay vì date để orderBy, vì date là string
    const q = query(memoriesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const memories = [];
    querySnapshot.forEach((doc) => {
      memories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📸 Loaded ${memories.length} memories from Firestore`);
    return memories;
  } catch (error) {
    console.error('❌ Load memories error:', error);
    // Nếu lỗi do thiếu index, thử load không orderBy
    if (error.code === 'failed-precondition') {
      try {
        const memoriesRef = collection(db, MEMORIES_COLLECTION);
        const querySnapshot = await getDocs(memoriesRef);
        const memories = [];
        querySnapshot.forEach((doc) => {
          memories.push({
            id: doc.id,
            ...doc.data()
          });
        });
        // Sort manually
        memories.sort((a, b) => {
          const dateA = a.createdAt || a.date || '';
          const dateB = b.createdAt || b.date || '';
          return dateB.localeCompare(dateA);
        });
        return memories;
      } catch (fallbackError) {
        console.error('❌ Fallback load error:', fallbackError);
        return [];
      }
    }
    return [];
  }
};

/**
 * Subscribe to real-time updates của memories
 * @param {Function} callback - Callback function nhận danh sách memories mới
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMemories = (callback) => {
  try {
    const memoriesRef = collection(db, MEMORIES_COLLECTION);
    const q = query(memoriesRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const memories = [];
        querySnapshot.forEach((doc) => {
          memories.push({
            id: doc.id,
            ...doc.data()
          });
        });
        console.log(`📸 Real-time update: ${memories.length} memories`);
        callback(memories);
      },
      (error) => {
        console.error('❌ Real-time subscription error:', error);
        // Fallback: load manually
        loadMemories().then(callback).catch(console.error);
      }
    );
  } catch (error) {
    console.error('❌ Subscribe error:', error);
    // Fallback: load manually
    loadMemories().then(callback).catch(console.error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Lưu một memory mới vào Firestore
 */
export const saveMemory = async (memory) => {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memory.id);
    const now = new Date().toISOString();
    await setDoc(memoryRef, {
      caption: memory.caption,
      family: memory.family,
      date: memory.date,
      image: memory.image,
      likes: memory.likes || 0,
      comments: memory.comments || [],
      createdAt: memory.createdAt || now,
      updatedAt: now
    }, { merge: false }); // Không merge để đảm bảo tạo mới hoàn toàn
    
    console.log('✅ Memory saved to Firestore:', memory.id);
    return true;
  } catch (error) {
    console.error('❌ Save memory error:', error);
    throw error;
  }
};

/**
 * Lưu tất cả memories vào Firestore (batch update)
 */
export const saveMemories = async (memories) => {
  try {
    // Lưu từng memory
    const promises = memories.map(memory => saveMemory(memory));
    await Promise.all(promises);
    
    console.log('✅ All memories saved to Firestore');
    return true;
  } catch (error) {
    console.error('❌ Save memories error:', error);
    throw error;
  }
};

/**
 * Cập nhật một memory trong Firestore
 */
export const updateMemory = async (memoryId, updates) => {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memoryId);
    await setDoc(memoryRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Memory updated in Firestore:', memoryId);
    return true;
  } catch (error) {
    console.error('❌ Update memory error:', error);
    throw error;
  }
};

/**
 * Xóa một memory khỏi Firestore
 */
export const deleteMemory = async (memoryId) => {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memoryId);
    await deleteDoc(memoryRef);
    
    console.log('✅ Memory deleted from Firestore:', memoryId);
    return true;
  } catch (error) {
    console.error('❌ Delete memory error:', error);
    throw error;
  }
};

/**
 * Lấy một memory theo ID
 */
export const getMemory = async (memoryId) => {
  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memoryId);
    const docSnap = await getDoc(memoryRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Get memory error:', error);
    return null;
  }
};

