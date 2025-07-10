import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../components/LoginPage.vue";
import Dashboard from "../components/Dashboard.vue";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

const routes = [
  { path: "/", component: LoginPage },
  {
    path: "/dashboard",
    component: Dashboard,
    beforeEnter: async (to, from, next) => {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        next();
      } else {
        next("/");
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
