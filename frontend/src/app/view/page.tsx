"use client";
import { useState, useEffect } from "react";
import { useConfig, useAccount } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { addresses, credentialSbtAbi, isValidAddress } from "../../contracts";
import { toGatewayUrl } from "../../lib/ipfs";
import { useToast } from "../providers";
import { useParams } from "next/navigation";
import { type Address } from "viem";

interface Profile {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  isPublic: boolean;
  customSlug?: string;
  category?: string;
  experience?: string;
  skills: string[];
  shareSettings?: {
    showCredentials: boolean;
    showActivity: boolean;
    showWalletAddress: boolean;
    allowSearch: boolean;
  };
}

interface Credential {
  tokenId: string;
  issuer: string;
  subject: string;
  cid: string;
  uri: string;
  gatewayUrl: string;
  issuedAtBlock: string;
  revoked: boolean;
  revokedAtBlock?: string;
}

export default function ViewPage() {
  const config = useConfig();
  const { address: connectedAddress } = useAccount();
  const { addToast } = useToast();
  const params = useParams();

  const [tokenId, setTokenId] = useState<string>("1");
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<any | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>("");

  const isOwnProfile = connectedAddress === profile?.walletAddress;
  
  // Check if we're viewing a profile (by wallet address or slug)
  const slugValue = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const isViewingProfile = slugValue && !/^\d+$/.test(slugValue);
  const slug = params.slug as string | undefined;

  useEffect(() => {
    if (isViewingProfile && slug) {
      fetchProfile();
    }
  }, [slug, isViewingProfile]);

  const fetchProfile = async () => {
    if (!slug) return;
    
    setLoadingProfile(true);
    setProfileError("");
    
    try {
      // Try to fetch profile by wallet address or custom slug
      const searchParam = isValidAddress(slug) ? `walletAddress=${slug}` : `slug=${slug}`;
      const res = await fetch(`/api/profile?${searchParam}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setProfileError("Profile not found");
        } else {
          setProfileError("Failed to load profile");
        }
        return;
      }
      
      const data = await res.json();
      
      // Check if profile is public
      if (!data.isPublic) {
        setProfileError("This profile is private");
        return;
      }
      
      setProfile(data);
      
      // Fetch credentials if profile allows showing them
      if (data.shareSettings?.showCredentials) {
        fetchCredentials(data.walletAddress);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfileError("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchCredentials = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/credentials?address=${walletAddress}&window=10000`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    }
  };

  async function fetchCredential() {
    try {
      setStatus("Fetching credential...");
      setData(null);
      setMetadata(null);
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");

      const token = BigInt(tokenId);
      const [cred, uri] = await Promise.all([
        readContract(config, {
          address: addresses.sbt,
          abi: credentialSbtAbi,
          functionName: "credential",
          args: [token],
        }),
        readContract(config, {
          address: addresses.sbt,
          abi: credentialSbtAbi,
          functionName: "tokenURI",
          args: [token],
        }),
      ]);

      setData({ ...cred, uri: String(uri) });

      // Try fetching metadata JSON via gateway
      const gatewayUrl = toGatewayUrl(String(uri));
      try {
        const res = await fetch(gatewayUrl);
        if (res.ok) {
          const json = await res.json();
          setMetadata(json);
          setStatus("");
          addToast({ type: "success", message: "Credential loaded" });
        } else {
          setStatus(`Fetched credential. Metadata fetch failed: ${res.status}`);
          addToast({ type: "error", message: `Metadata fetch failed: ${res.status}` });
        }
      } catch (e) {
        setStatus("Fetched credential. Metadata fetch failed.");
        addToast({ type: "error", message: "Metadata fetch failed" });
      }
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Fetch failed";
      setStatus(msg);
      addToast({ type: "error", message: msg });
    }
  }

  async function revoke() {
    const explorer = (h: string) => `https://moonbase.moonscan.io/tx/${h}`;
    try {
      setStatus("Revoking credential...");
      if (!isValidAddress(addresses.sbt)) throw new Error("SBT address not set");
      const token = BigInt(tokenId);
      const hash = await writeContract(config, {
        address: addresses.sbt,
        abi: credentialSbtAbi,
        functionName: "revoke",
        args: [token],
      });
      addToast({ type: "info", message: "Revoke submitted", link: { href: explorer(hash), label: "View tx" } });
      await waitForTransactionReceipt(config, { hash });
      setStatus("Revoked. Refreshing...");
      addToast({ type: "success", message: "Credential revoked", link: { href: explorer(hash), label: "View tx" } });
      await fetchCredential();
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Revoke failed";
      setStatus(msg);
      addToast({ type: "error", message: msg });
    }
  }

  // If viewing a profile
  if (isViewingProfile) {
    if (loadingProfile) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-600 mt-1">{profileError}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600">Profile not found</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-2xl">
                  {(profile.displayName || profile.username || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.displayName || profile.username || "Anonymous"}
                {profile.username && profile.displayName && (
                  <span className="text-gray-600 ml-2">(@{profile.username})</span>
                )}
              </h1>
              
              {profile.title && (
                <p className="text-gray-700 mt-1">{profile.title}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.category && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {profile.category}
                  </span>
                )}
                {profile.experience && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {profile.experience}
                  </span>
                )}
              </div>
              
              {profile.shareSettings?.showWalletAddress && (
                <p className="text-gray-500 text-sm mt-2">
                  Wallet: {profile.walletAddress}
                </p>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <p className="text-gray-700 mt-4">{profile.bio}</p>
          )}
          
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Credentials Section */}
        {profile.shareSettings?.showCredentials && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Credentials</h2>
            
            {credentials.length === 0 ? (
              <p className="text-gray-600">No credentials found</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {credentials.map((credential) => (
                  <div
                    key={credential.tokenId}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Token #{credential.tokenId}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          credential.revoked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {credential.revoked ? "Revoked" : "Active"}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Issuer:</span>{" "}
                        <span className="break-all">{credential.issuer}</span>
                      </div>
                      <div>
                        <span className="font-medium">CID:</span>{" "}
                        <span className="break-all">{credential.cid}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <a
                        href={credential.gatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Metadata
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isOwnProfile && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Manage Your Profile</h3>
            <div className="flex gap-3">
              <a
                href="/profile"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </a>
              <a
                href="/my"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                View My Credentials
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: View credential by token ID
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">View Credential</h1>
      <div className="mt-4">
        <label className="block text-sm mb-1">Token ID</label>
        <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} className="w-full rounded border p-2" />
        <button onClick={fetchCredential} className="mt-3 rounded bg-zinc-800 px-3 py-2 text-white">Fetch</button>
      </div>

      {data && (
        <div className="mt-6 space-y-1 text-sm">
          <p><span className="font-medium">Issuer:</span> {data.issuer}</p>
          <p><span className="font-medium">Subject:</span> {data.subject}</p>
          <p><span className="font-medium">Issued At:</span> {new Date(Number(data.issuedAt) * 1000).toLocaleString()}</p>
          <p><span className="font-medium">Revoked:</span> {data.revoked ? "Yes" : "No"}</p>
          <p><span className="font-medium">TokenURI:</span> {data.uri}</p>
          <p><span className="font-medium">Gateway:</span> <a className="text-blue-600 underline" href={toGatewayUrl(data.uri)} target="_blank">{toGatewayUrl(data.uri)}</a></p>
          <div className="mt-3">
            <button onClick={revoke} className="rounded bg-red-600 px-3 py-2 text-white">Revoke (issuer only)</button>
          </div>
        </div>
      )}

      {metadata && (
        <div className="mt-6">
          <h2 className="font-medium">Metadata</h2>
          <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-zinc-100 p-3 text-xs">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}

      {status && <p className="mt-4 text-sm">{status}</p>}

      {!isValidAddress(addresses.sbt) && (
        <p className="mt-4 text-xs text-amber-600">Set NEXT_PUBLIC_SBT_ADDRESS in .env.local.</p>
      )}
    </div>
  );
}
