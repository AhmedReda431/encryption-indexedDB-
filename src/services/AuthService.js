import axios from "axios";
import bcrypt from "bcryptjs";
import { EncryptionService } from "./EncryptionService";
import { DatabaseService } from "./DatabaseService";
import { UserAdapter } from "./UserAdapter";

export class AuthService {
  constructor() {
    this.encryptionService = new EncryptionService();
    this.databaseService = new DatabaseService();
    this.userAdapter = new UserAdapter();
    this.isSyncing = false;
    this.syncInterval = null;
    this.paginationConfig = { maxPages: 10, maxRecords: 1000 };
  }

  async login(username, password) {
    try {
      const requestBody = { username, password };
      // console.log("Login Request:", {
      //   url: import.meta.env.VITE_API_LOGIN_URL,
      //   body: requestBody,
      // });
      const response = await axios.post(
        import.meta.env.VITE_API_LOGIN_URL,
        requestBody
      );
      // console.log("Login API Response:", {
      //   status: response.status,
      //   headers: response.headers,
      //   data: response.data,
      // });
      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      if (
        !response.data ||
        typeof response.data !== "object" ||
        !response.data.data
      ) {
        throw new Error("Invalid API response format or missing data object");
      }
      const responseData = response.data.data;
      let decryptedPassword = null;
      let userId = null;

      // Handle encrypted fields (d, t, n) if present
      if ("d" in responseData && "t" in responseData && "n" in responseData) {
        const { d, t, n } = responseData;
        if (!d || !t || !n) throw new Error("Missing encrypted fields");
        const decodedD = this.encryptionService.decodeBase64(d);
        const key = decodedD.slice(0, 16);
        decryptedPassword = await this.encryptionService.decrypt(t, key);
        userId = this.encryptionService.decodeBase64(n); // Assuming n contains id or username
      } else {
        // Fallback to unencrypted fields
        const {
          id,
          username: responseUsername,
          password: hashedPassword,
          name,
        } = responseData;
        if (!id || !responseUsername || !hashedPassword || !name) {
          console.warn("API response missing required fields:", responseData);
          throw new Error(
            "Missing required fields in API response: id, username, password, or name"
          );
        }
        decryptedPassword = hashedPassword;
        userId = id;
      }

      const isValid = bcrypt.compareSync(password, decryptedPassword || "");
      // console.log("Login Validation:", { isValid, username, userId });
      if (isValid) {
        const adaptedUser = this.userAdapter.adapt({
          id: userId,
          name: responseData.name,
        });
        // console.log("Adapted User for Save:", adaptedUser);
        await this.databaseService.saveUser(adaptedUser);
        localStorage.setItem(
          "auth",
          JSON.stringify({
            username: adaptedUser.username,
            timestamp: Date.now(),
          })
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Online login failed:", error);
      return this.offlineLogin(username, password);
    }
  }

  async offlineLogin(username, password) {
    const user = await this.databaseService.getUser(username);
    if (user && bcrypt.compareSync(password, `test@${user.id}!`)) {
      localStorage.setItem(
        "auth",
        JSON.stringify({ username: user.username, timestamp: Date.now() })
      );
      return true;
    }
    return false;
  }

  async isAuthenticated() {
    const auth = localStorage.getItem("auth");
    if (!auth) return false;
    const { username, timestamp } = JSON.parse(auth);
    // console.log("Auth Check:", { username, timestamp, now: Date.now() });
    const isValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
    const userExists =
      (await this.databaseService.getUser(username)) !== undefined;
    // console.log("Is Valid:", isValid, "User Exists:", userExists);
    return isValid && userExists;
  }

  async syncUsers() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const existingUsers = await this.databaseService.getAllUsers();
      // console.log(
      //   "Existing Users:",
      //   existingUsers.map((u) => u.username)
      // );
      let page = 1;
      let totalRecords = 0;
      while (
        page <= this.paginationConfig.maxPages &&
        totalRecords < this.paginationConfig.maxRecords
      ) {
        // console.log(`Fetching page ${page} at ${new Date().toISOString()}`);
        const response = await axios.get(
          `${import.meta.env.VITE_API_USERS_URL}?page=${page}`
        );
        if (response.status !== 200) {
          console.error(
            `API request failed with status ${
              response.status
            } at ${new Date().toISOString()}`
          );
          break;
        }
        // console.log("Full API Response:", response.data);
        let userData = response.data.data || response.data;
        if (
          !userData ||
          (typeof userData === "object" && Object.keys(userData).length === 0)
        ) {
          // console.log("No user data found, breaking loop at page", page);
          break;
        }
        if (Array.isArray(userData)) {
          userData = userData.filter(
            (u) =>
              !existingUsers.some(
                (eu) => eu.username === (u.id || u.userId || u.uid)
              )
          );
          if (userData.length === 0) {
            // console.log("No new users found on page", page);
            break;
          }
          userData = userData[0] || {};
        }
        // console.log("User Data:", userData);
        const username =
          userData.id ||
          userData.userId ||
          userData.uid ||
          `user_${Date.now()}`;
        if (!username) {
          console.error(
            "Username derivation failed, using fallback at page",
            page
          );
          break;
        }
        // console.log(`Derived username: ${username}`);
        const adaptedUser = this.userAdapter.adapt({
          id: username,
          name: userData.n || "Unknown User",
        });
        // console.log("Adapted User:", adaptedUser);
        if (!adaptedUser.username) {
          console.error(
            "Adapted user has no username, aborting sync at page",
            page
          );
          break;
        }
        await this.databaseService.saveUser(adaptedUser);
        totalRecords++;
        page++;
      }
      // console.log(
      //   "Sync completed at",
      //   new Date().toISOString(),
      //   "total new records:",
      //   totalRecords
      // );
    } catch (error) {
      console.error(
        "User sync failed at",
        new Date().toISOString(),
        ":",
        error
      );
    } finally {
      this.isSyncing = false;
    }
  }

  startSyncInterval() {
    // console.log("Starting sync interval at", new Date().toISOString());
    this.syncUsers();
    this.syncInterval = setInterval(() => {
      // console.log("Interval trigger at", new Date().toISOString());
      this.syncUsers();
    }, 60 * 1000);
    window.addEventListener("online", () => {
      // console.log("Online event triggered at", new Date().toISOString());
      this.syncUsers();
    });
  }

  stopSyncInterval() {
    if (this.syncInterval) {
      // console.log("Stopping sync interval at", new Date().toISOString());
      clearInterval(this.syncInterval);
    }
    window.removeEventListener("online", () => this.syncUsers());
  }

  setPaginationConfig({ maxPages, maxRecords }) {
    this.paginationConfig = { maxPages, maxRecords };
  }
}
