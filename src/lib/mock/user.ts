import { UserProfile } from "@/types";

export const mockUser: UserProfile = {
  id: "user-001",
  name: "Alex Morgan",
  email: "alex.morgan@email.com",
  connectedAccounts: [
    {
      id: "acc-1",
      type: "insurance",
      label: "Blue Cross Blue Shield",
      status: "connected",
      lastSync: "2026-03-21T08:00:00Z",
    },
    {
      id: "acc-2",
      type: "bank",
      label: "Chase Checking ••4821",
      status: "connected",
      lastSync: "2026-03-20T22:00:00Z",
    },
    {
      id: "acc-3",
      type: "hsa",
      label: "Fidelity HSA",
      status: "connected",
      lastSync: "2026-03-19T12:00:00Z",
    },
    {
      id: "acc-4",
      type: "fsa",
      label: "FSA Account",
      status: "disconnected",
    },
  ],
  preferences: {
    notifications: true,
    emailDigest: false,
    darkMode: false,
    currency: "USD",
  },
};
