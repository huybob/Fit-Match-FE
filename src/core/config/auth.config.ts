export const authConfig = {
  publicRoutes: ["/", "/login", "/register", "/forgot-password"],
  roleRoutes: {
    ROLE_CUSTOMER: "/profile",
    ROLE_PT: "/trainer/profile",
    ROLE_GYM_OPERATOR: "/schedule",
    ROLE_ADMIN: "/admin",
  },
};
