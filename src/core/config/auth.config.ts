export const authConfig = {
  publicRoutes: ["/", "/login", "/register", "/forgot-password"],
  roleRoutes: {
    ROLE_CUSTOMER: "/profile",
    ROLE_PT: "/schedule",
    ROLE_GYM_OPERATOR: "/gym/gyms",
    ROLE_ADMIN: "/admin",
  },
};
