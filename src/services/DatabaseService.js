import { openDB } from 'idb';

export class DatabaseService {
  constructor(dbName = 'UserSyncDB', storeName = 'users') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  async initDB() {
    return openDB(this.dbName, 1, {
      upgrade(db) {
        db.createObjectStore('users', { keyPath: 'username' });
      }
    });
  }

  async saveUser(user) {
    const db = await this.dbPromise;
    return db.put(this.storeName, user);
  }

  async getUser(username) {
    const db = await this.dbPromise;
    return db.get(this.storeName, username);
  }

  async getAllUsers() {
    const db = await this.dbPromise;
    return db.getAll(this.storeName);
  }

  async clearUsers() {
    const db = await this.dbPromise;
    return db.clear(this.storeName);
  }
}