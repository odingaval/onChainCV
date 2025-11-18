"use client";

import { useAccount } from "wagmi";
import ProfileManager from "../../components/ProfileManager";

export default function ProfilePage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Profile Management</h2>
        <p className="text-gray-600">Please connect your wallet to manage your profile.</p>
      </div>
    );
  }

  return <ProfileManager />;
}