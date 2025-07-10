<template>
  <!-- Dashboard.vue -->
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card class="pa-6 elevation-6">
          <v-card-title class="text-h4">Dashboard</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="user in users" :key="user.id" two-line>
                <v-list-item-content>
                  <v-list-item-title
                    >Username: {{ user.username }}</v-list-item-title
                  >
                  <v-list-item-subtitle
                    >First Name: {{ user.firstName }}</v-list-item-subtitle
                  >
                  <v-list-item-subtitle
                    >Last Name: {{ user.lastName }}</v-list-item-subtitle
                  >
                  <v-list-item-subtitle
                    >Masked Name: {{ user.maskedName }}</v-list-item-subtitle
                  >
                  <v-list-item-subtitle
                    >User ID: {{ user.id }}</v-list-item-subtitle
                  >
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="logout" large>Logout</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { DatabaseService } from "../services/DatabaseService";

export default {
  data() {
    return {
      users: [],
      databaseService: new DatabaseService(),
    };
  },
  async created() {
    this.users = await this.databaseService.getAllUsers();
  },
  methods: {
    logout() {
      localStorage.removeItem("auth");
      this.$router.push("/");
    },
  },
};
</script>
