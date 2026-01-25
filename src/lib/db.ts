// IndexedDB database for persistent photo metadata and indexing
const DB_NAME = 'pixona_photos_db';
const DB_VERSION = 1;
const STORES = {
  photos: 'photos',
  albums: 'albums',
  people: 'people',
  places: 'places',
  settings: 'settings',
  cache: 'cache',
};

export interface PhotoMetadata {
  id: string;
  path: string;
  name: string;
  type: 'image' | 'video';
  size: number;
  created: Date;
  modified: Date;
  imported: Date;
  width?: number;
  height?: number;
  duration?: number; // for videos
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  tags: string[];
  albumIds: string[];
  peopleIds: string[];
  hash?: string; // for duplicate detection
  thumbnailData?: string; // base64 thumbnail
  metadata?: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
    iso?: string;
    shutterSpeed?: string;
  };
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  created: Date;
  photoIds: string[];
  coverPhotoId?: string;
}

export interface Person {
  id: string;
  name: string;
  photoIds: string[];
  avatarPhotoId?: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  photoIds: string[];
}

export interface Settings {
  key: string;
  value: any;
}

class PhotoDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Photos store
        if (!db.objectStoreNames.contains(STORES.photos)) {
          const photosStore = db.createObjectStore(STORES.photos, { keyPath: 'id' });
          photosStore.createIndex('path', 'path', { unique: true });
          photosStore.createIndex('type', 'type', { unique: false });
          photosStore.createIndex('created', 'created', { unique: false });
          photosStore.createIndex('modified', 'modified', { unique: false });
          photosStore.createIndex('imported', 'imported', { unique: false });
          photosStore.createIndex('hash', 'hash', { unique: false });
        }

        // Albums store
        if (!db.objectStoreNames.contains(STORES.albums)) {
          db.createObjectStore(STORES.albums, { keyPath: 'id' });
        }

        // People store
        if (!db.objectStoreNames.contains(STORES.people)) {
          db.createObjectStore(STORES.people, { keyPath: 'id' });
        }

        // Places store
        if (!db.objectStoreNames.contains(STORES.places)) {
          db.createObjectStore(STORES.places, { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'key' });
        }

        // Cache store
        if (!db.objectStoreNames.contains(STORES.cache)) {
          const cacheStore = db.createObjectStore(STORES.cache, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Photo operations
  async addPhoto(photo: PhotoMetadata): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readwrite');
      const store = transaction.objectStore(STORES.photos);
      const request = store.add(photo);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addPhotos(photos: PhotoMetadata[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readwrite');
      const store = transaction.objectStore(STORES.photos);
      
      photos.forEach(photo => store.add(photo));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPhoto(id: string): Promise<PhotoMetadata | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readonly');
      const store = transaction.objectStore(STORES.photos);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPhotos(): Promise<PhotoMetadata[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readonly');
      const store = transaction.objectStore(STORES.photos);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePhoto(id: string, updates: Partial<PhotoMetadata>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise(async (resolve, reject) => {
      const photo = await this.getPhoto(id);
      if (!photo) {
        reject(new Error('Photo not found'));
        return;
      }

      const updatedPhoto = { ...photo, ...updates };
      
      const transaction = this.db!.transaction([STORES.photos], 'readwrite');
      const store = transaction.objectStore(STORES.photos);
      const request = store.put(updatedPhoto);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updatePhotos(photoIds: string[], updates: Partial<PhotoMetadata>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([STORES.photos], 'readwrite');
    const store = transaction.objectStore(STORES.photos);
    
    for (const id of photoIds) {
      const request = store.get(id);
      request.onsuccess = () => {
        const photo = request.result;
        if (photo) {
          const updatedPhoto = { ...photo, ...updates };
          store.put(updatedPhoto);
        }
      };
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readwrite');
      const store = transaction.objectStore(STORES.photos);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhotos(ids: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([STORES.photos], 'readwrite');
    const store = transaction.objectStore(STORES.photos);
    
    ids.forEach(id => store.delete(id));
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPhotosByDate(startDate: Date, endDate: Date): Promise<PhotoMetadata[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readonly');
      const store = transaction.objectStore(STORES.photos);
      const index = store.index('created');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhotosByHash(hash: string): Promise<PhotoMetadata[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.photos], 'readonly');
      const store = transaction.objectStore(STORES.photos);
      const index = store.index('hash');
      const request = index.getAll(hash);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings operations
  async getSetting<T>(key: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.settings], 'readonly');
      const store = transaction.objectStore(STORES.settings);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.settings], 'readwrite');
      const store = transaction.objectStore(STORES.settings);
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(Object.values(STORES), 'readwrite');
      
      Object.values(STORES).forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // People operations
  async addPerson(person: Person): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.people], 'readwrite');
      const store = transaction.objectStore(STORES.people);
      const request = store.add(person);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPeople(): Promise<Person[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.people], 'readonly');
      const store = transaction.objectStore(STORES.people);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPerson(id: string): Promise<Person | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.people], 'readonly');
      const store = transaction.objectStore(STORES.people);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.people], 'readwrite');
      const store = transaction.objectStore(STORES.people);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const person = getRequest.result;
        if (person) {
          const updatedPerson = { ...person, ...updates };
          const putRequest = store.put(updatedPerson);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Person not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deletePerson(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.people], 'readwrite');
      const store = transaction.objectStore(STORES.people);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new PhotoDatabase();

// ===========================================
// IPC WRAPPER FUNCTIONS FOR SQLITE BACKEND
// ===========================================

/**
 * Get all photos from the Electron backend (SQLite database)
 * This bridges the gap between React frontend and Electron backend
 */
export async function getPhotosFromBackend(): Promise<PhotoMetadata[]> {
  if (!window.electron) {
    console.warn('Electron API not available - running in web mode');
    return [];
  }
  
  try {
    const result = await window.electron.invoke('get-all-photos');
    
    if (!result.success) {
      console.error('Failed to get photos from backend:', result.error);
      return [];
    }
    
    // Convert date strings back to Date objects
    return result.photos.map((p: any) => ({
      ...p,
      created: new Date(p.created),
      modified: new Date(p.modified),
      imported: new Date(p.imported || p.created)
    }));
  } catch (error) {
    console.error('Error fetching photos from backend:', error);
    return [];
  }
}

/**
 * Get photos filtered by date range from the backend
 */
export async function getPhotosByDateFromBackend(startDate: Date, endDate: Date): Promise<PhotoMetadata[]> {
  if (!window.electron) return [];
  
  try {
    const result = await window.electron.invoke('get-photos-by-date', startDate.toISOString(), endDate.toISOString());
    
    if (!result.success) {
      console.error('Failed to get photos by date:', result.error);
      return [];
    }
    
    return result.photos.map((p: any) => ({
      ...p,
      created: new Date(p.created),
      modified: new Date(p.modified),
      imported: new Date(p.imported || p.created)
    }));
  } catch (error) {
    console.error('Error fetching photos by date:', error);
    return [];
  }
}

/**
 * Get photos filtered by camera from the backend
 */
export async function getPhotosByCameraFromBackend(camera: string): Promise<PhotoMetadata[]> {
  if (!window.electron) return [];
  
  try {
    const result = await window.electron.invoke('get-photos-by-camera', camera);
    
    if (!result.success) {
      console.error('Failed to get photos by camera:', result.error);
      return [];
    }
    
    return result.photos.map((p: any) => ({
      ...p,
      created: new Date(p.created),
      modified: new Date(p.modified),
      imported: new Date(p.imported || p.created)
    }));
  } catch (error) {
    console.error('Error fetching photos by camera:', error);
    return [];
  }
}
