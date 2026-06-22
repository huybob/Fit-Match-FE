export const trainerKeys = {
  all: ["trainer"] as const,
  publicProfile: (userId: number) => [...trainerKeys.all, "public-profile", userId] as const,
  myProfile: () => [...trainerKeys.all, "my-profile"] as const,
  publicServices: (profileId: number) => [...trainerKeys.all, "public-services", profileId] as const,
  services: () => [...trainerKeys.all, "services"] as const,
  publicAvailability: (profileId: number) => [...trainerKeys.all, "public-availability", profileId] as const,
  availability: () => [...trainerKeys.all, "availability"] as const,
  publicCertificates: (profileId: number) => [...trainerKeys.all, "public-certificates", profileId] as const,
  certificates: () => [...trainerKeys.all, "certificates"] as const,
  partnerships: () => [...trainerKeys.all, "partnerships"] as const,
};
