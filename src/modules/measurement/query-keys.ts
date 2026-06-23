export const measurementKeys = {
  all: ["measurements"] as const,
  mine: () => [...measurementKeys.all, "mine"] as const,
  byCustomer: (customerId: number) => [...measurementKeys.all, "customer", customerId] as const,
};
