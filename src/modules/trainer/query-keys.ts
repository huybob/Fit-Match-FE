export const trainerKeys = {
  all: ["trainer"] as const,
  myProfile: () => [...trainerKeys.all, "my-profile"] as const,
};
