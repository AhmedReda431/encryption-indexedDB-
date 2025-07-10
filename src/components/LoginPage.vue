<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-6 elevation-6">
          <v-card-title class="text-h4 text-center mb-4">Login</v-card-title>
          <v-form @submit.prevent="handleLogin">
            <v-text-field
              v-model="username"
              label="Username"
              prepend-inner-icon="mdi-account"
              outlined
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              prepend-inner-icon="mdi-lock"
              outlined
              class="mb-4"
            ></v-text-field>
            <v-btn
              color="primary"
              type="submit"
              block
              :disabled="loading"
              class="mt-4"
              large
              >Login</v-btn
            >
          </v-form>
          <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="syncDialog" persistent max-width="400">
      <v-card>
        <v-card-title>Syncing Users</v-card-title>
        <v-card-text>
          <v-progress-circular indeterminate color="primary" size="64" />
          <span class="ml-4">Synchronizing user data...</span>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { AuthService } from "../services/AuthService";

export default {
  data() {
    return {
      username: "",
      password: "",
      loading: false,
      error: "",
      syncDialog: true,
      authService: new AuthService(),
    };
  },
  async created() {
    await this.authService.syncUsers();
    this.syncDialog = false;
    this.authService.startSyncInterval();
  },
  beforeUnmount() {
    this.authService.stopSyncInterval();
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = "";
      try {
        const success = await this.authService.login(
          this.username,
          this.password
        );
        console.log("Login Success:", success);
        if (success) {
          const isAuthenticated = await this.authService.isAuthenticated();
          console.log("Is Authenticated:", isAuthenticated);
          if (isAuthenticated) {
            try {
              await this.$router.push("/dashboard");
              console.log("Redirected to /dashboard");
            } catch (navError) {
              this.error = "Failed to redirect to dashboard.";
              console.error("Navigation Error:", navError);
            }
          } else {
            this.error = "Authentication state invalid after login.";
          }
        } else {
          this.error = "Invalid credentials";
        }
      } catch (error) {
        this.error = "Login failed. Please try again.";
        console.error("Login Error:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style>
.fill-height {
  height: 100vh;
}
</style>
