"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { useToast } from "../app/providers";

interface Profile {
  id: string;
  walletAddress: Address;
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
  showCredentials?: boolean;
  showActivity?: boolean;
  showWalletAddress?: boolean;
  allowSearch?: boolean;
}

export default function ProfileManager() {
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    title: "",
    bio: "",
    avatarUrl: "",
    isPublic: false,
    customSlug: "",
    category: "",
    experience: "",
    skills: "",
    showCredentials: true,
    showActivity: true,
    showWalletAddress: false,
    allowSearch: true
  });

  useEffect(() => {
    if (address) {
      fetchProfile();
    }
  }, [address]);

  const fetchProfile = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?walletAddress=${address}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          username: data.username || "",
          displayName: data.displayName || "",
          title: data.title || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          isPublic: data.isPublic || false,
          customSlug: data.customSlug || "",
          category: data.category || "",
          experience: data.experience || "",
          skills: (data.skills || []).join(", "),
          showCredentials: data.showCredentials ?? true,
          showActivity: data.showActivity ?? true,
          showWalletAddress: data.showWalletAddress ?? false,
          allowSearch: data.allowSearch ?? true
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!profile || !baseUrl) return '';
    
    if (profile.customSlug) {
      return `${baseUrl}/view/${profile.customSlug}`;
    }
    return `${baseUrl}/view/${profile.walletAddress}`;
  };

  const handleSave = async () => {
    if (!address) return;
    
    setSaving(true);
    try {
      const profileData = {
        walletAddress: address,
        username: formData.username,
        displayName: formData.displayName,
        title: formData.title,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
        isPublic: formData.isPublic,
        customSlug: formData.customSlug,
        category: formData.category,
        experience: formData.experience,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        showCredentials: formData.showCredentials,
        showActivity: formData.showActivity,
        showWalletAddress: formData.showWalletAddress,
        allowSearch: formData.allowSearch
      };

      const res = await fetch('/api/profile', {
        method: profile ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsEditing(false);
        addToast({ type: 'success', message: 'Profile saved successfully!' });
      } else {
        const error = await res.json();
        addToast({ type: 'error', message: error.error || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      addToast({ type: 'error', message: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    const url = getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({ type: 'success', message: 'Profile URL copied to clipboard!' });
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Profile Management</h2>
        <p className="text-gray-300">Please connect your wallet to manage your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Profile Management</h2>
        <p className="text-gray-300">Loading profile...</p>
      </div>
    );
  }

  // View mode - display saved profile
  if (profile && !isEditing) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Profile Management</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>
        
        {/* Profile Display */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Profile Information</h3>
          
          {profile.avatarUrl && (
            <div className="flex items-center space-x-4">
              <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full" />
              <div>
                <h4 className="text-xl font-semibold text-white">{profile.displayName || 'No display name'}</h4>
                <p className="text-gray-400">@{profile.username || 'No username'}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Title:</span>
              <p className="text-white">{profile.title || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Bio:</span>
              <p className="text-white">{profile.bio || 'No bio'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Category:</span>
              <p className="text-white">{profile.category || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Experience:</span>
              <p className="text-white">{profile.experience || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Skills:</span>
              <p className="text-white">{profile.skills?.join(', ') || 'No skills listed'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Profile Status:</span>
              <p className="text-white">{profile.isPublic ? 'Public' : 'Private'}</p>
            </div>
            {profile.customSlug && (
              <div>
                <span className="text-sm text-gray-400">Custom URL:</span>
                <p className="text-white">/view/{profile.customSlug}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Share Settings Display */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Sharing Settings</h3>
          <div className="space-y-2">
            <p className="text-white">{profile.showCredentials ? '✓' : '✗'} Show credentials</p>
            <p className="text-white">{profile.showActivity ? '✓' : '✗'} Show activity</p>
            <p className="text-white">{profile.showWalletAddress ? '✓' : '✗'} Show wallet address</p>
            <p className="text-white">{profile.allowSearch ? '✓' : '✗'} Allow search</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Profile Management</h2>
        {profile && (
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      {/* Basic Information */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Display Name</label>
          <input
            type="text"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Username</label>
          <input
            type="text"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="@username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Title</label>
          <input
            type="text"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Your professional title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Bio</label>
          <textarea
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Skills (comma-separated)</label>
          <input
            type="text"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="React, TypeScript, Node.js"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Category</label>
          <select
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="">Select a category</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Experience</label>
          <select
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          >
            <option value="">Select experience level</option>
            <option value="junior">Junior (0-2 years)</option>
            <option value="mid">Mid (2-5 years)</option>
            <option value="senior">Senior (5+ years)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Avatar URL</label>
          <input
            type="url"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Profile Visibility</h3>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-white">
            Make profile public
          </label>
        </div>

        {formData.isPublic && (
          <div className="space-y-3 pl-7">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showCredentials"
                checked={formData.showCredentials}
                onChange={(e) => setFormData({ ...formData, showCredentials: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="showCredentials" className="text-sm font-medium text-white">
                Show credentials
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showActivity"
                checked={formData.showActivity}
                onChange={(e) => setFormData({ ...formData, showActivity: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="showActivity" className="text-sm font-medium text-white">
                Show activity
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showWalletAddress"
                checked={formData.showWalletAddress}
                onChange={(e) => setFormData({ ...formData, showWalletAddress: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="showWalletAddress" className="text-sm font-medium text-white">
                Show wallet address
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allowSearch"
                checked={formData.allowSearch}
                onChange={(e) => setFormData({ ...formData, allowSearch: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowSearch" className="text-sm font-medium text-white">
                Allow search indexing
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Profile Sharing */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Profile Sharing</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Custom URL Slug (optional)</label>
          <input
            type="text"
            className="w-full border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
            value={formData.customSlug}
            onChange={(e) => setFormData({ ...formData, customSlug: e.target.value })}
            placeholder="john-doe"
          />
          <p className="text-xs text-gray-400 mt-1">
            Creates a custom URL: {baseUrl ? `${baseUrl}/view/john-doe` : '/view/john-doe'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Share URL</label>
          <div className="flex space-x-2">
            <input
              type="text"
              readOnly
              className="flex-1 border border-white/20 rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400"
              value={getShareUrl()}
              placeholder="Your profile share URL will appear here"
              style={{ 
                color: 'white', 
                WebkitTextFillColor: 'white',
                opacity: 1
              }}
            />
            <button
              onClick={async () => {
                const url = getShareUrl();
                if (url) {
                  try {
                    await navigator.clipboard.writeText(url);
                    addToast({ type: 'success', message: 'Profile URL copied to clipboard!' });
                  } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      addToast({ type: 'success', message: 'Profile URL copied to clipboard!' });
                    } catch (fallbackErr) {
                      addToast({ type: 'error', message: 'Failed to copy URL' });
                    }
                    document.body.removeChild(textArea);
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
