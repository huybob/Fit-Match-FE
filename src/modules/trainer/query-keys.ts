export const trainerKeys = {
  all: ["trainer"] as const,
  myProfile: () => [...trainerKeys.all, "my-profile"] as const,
  verification: () => [...trainerKeys.all, "verification"] as const,
  availability: () => [...trainerKeys.all, "availability"] as const,
  blockedTimes: () => [...trainerKeys.all, "blocked-times"] as const,
  certificates: () => [...trainerKeys.all, "certificates"] as const,
};
