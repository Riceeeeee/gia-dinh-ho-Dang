// src/db.js

const DB_NAME = 'family_memories_db';
const STORE_NAME = 'memories_files';
const DB_VERSION = 1;

let db;

/**
 * Initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Saves data (like a File or Blob) to IndexedDB.
 * @param {string|number} id - The unique ID for the data.
 * @param {any} data - The data to store.
 * @returns {Promise<any>} A promise that resolves when the data is saved.
 */
export const saveData = (id, data) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Database not initialized. Cannot save data.");
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, data });
        
        transaction.oncomplete = () => {
            resolve(request.result);
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };
    } catch (error) {
        reject(error);
    }
  });
};

/**
 * Retrieves data from IndexedDB by its ID.
 * @param {string|number} id - The ID of the data to retrieve.
 * @returns {Promise<any>} A promise that resolves with the retrieved data, or null if not found.
 */
export const getData = (id) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized. Cannot get data.");
        
        try {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            transaction.oncomplete = () => {
                resolve(request.result ? request.result.data : null);
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Deletes data from IndexedDB by its ID.
 * @param {string|number} id - The ID of the data to delete.
 * @returns {Promise<void>} A promise that resolves when the data is deleted.
 */
export const deleteData = (id) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("Database not initialized. Cannot delete data.");
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);
        
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };
    } catch (error) {
        reject(error);
    }
  });
};
