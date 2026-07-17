
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { profileApi } from '@/lib/endpoints';
import { AppUser } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { initials } from '@/lib/format';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Camera, Loader2, User, Mail, Building, Shield, Key, Trash2, Check } from 'lucide-react';

function ProfileBody() {
  const { user, setSession, token, refreshUser } = useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.get();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
      setProfilePicture(data.profilePicture);
      setImageError(false);
    } catch (err) {
      setError(errorMessage(err));
      notify(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await profileApi.update({ name });
      setProfile(updated);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            name: updated.name,
          },
        });
      }
      await refreshUser();
      notify('Profile updated successfully!', 'success');
    } catch (err) {
      setError(errorMessage(err));
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      notify('Only JPEG, PNG, GIF, and WEBP images are allowed', 'error');
      return;
    }

    if (file.size > maxSize) {
      notify('Image size must be less than 2MB', 'error');
      return;
    }

    handleUpload(file);
    e.target.value = '';
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const updated = await profileApi.uploadPicture(file);
      setProfile(updated);
      setProfilePicture(updated.profilePicture);
      setImageError(false);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            profilePicture: updated.profilePicture,
          },
        });
      }
      await refreshUser();
      notify('Profile picture updated!', 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    setShowConfirmDialog(true);
  };

  const confirmRemovePicture = async () => {
    setConfirmLoading(true);
    try {
      const updated = await profileApi.removePicture();
      setProfile(updated);
      setProfilePicture(null);
      setImageError(false);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            profilePicture: null,
          },
        });
      }
      await refreshUser();
      notify('Profile picture removed', 'success');
      setShowConfirmDialog(false);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      notify('Password changed successfully!', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(errorMessage(err));
      notify(errorMessage(err), 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getProfileImageUrl = () => {
    if (profilePicture && !imageError) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${baseUrl}/uploads/profile-pictures/${profilePicture}`;
    }
    return null;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="banner banner-danger">{error}</div>;
  }

  const imageUrl = getProfileImageUrl();

  return (
    <div className="profile-page">
      {showConfirmDialog && (
        <ConfirmDialog
          title="Remove Profile Picture"
          message="Are you sure you want to remove your profile picture?"
          confirmLabel="Remove"
          danger
          loading={confirmLoading}
          onConfirm={confirmRemovePicture}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-grid">
        {/* Left Column - Profile Picture */}
        <div className="profile-card profile-avatar-card">
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={profile?.name || 'User'}
                  className="profile-avatar-image"
                  onError={handleImageError}
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {initials(profile?.name || '')}
                </div>
              )}
              {uploading && (
                <div className="profile-avatar-uploading">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="profile-avatar-actions">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="profile-avatar-btn profile-avatar-btn-primary"
              >
                <Camera size={16} />
                {profilePicture ? 'Change Photo' : 'Upload Photo'}
              </button>
              {profilePicture && (
                <button
                  onClick={handleRemovePicture}
                  disabled={uploading}
                  className="profile-avatar-btn profile-avatar-btn-danger"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

          </div>
        </div>

        {/* Right Column - Profile Info */}
        <div className="profile-card profile-info-card">
          <form onSubmit={handleProfileUpdate}>
            <div className="profile-form-group">
              <label className="profile-form-label">
                <User size={18} />
                Full Name
              </label>
              <input
                type="text"
                className="profile-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                className="profile-form-input profile-form-input-disabled"
                value={email}
                disabled
              />
              <span className="profile-form-hint">Email cannot be changed</span>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group profile-form-group-half">
                <label className="profile-form-label">
                  <Shield size={18} />
                  Role
                </label>
                <input
                  type="text"
                  className="profile-form-input profile-form-input-disabled"
                  value={profile?.role?.name || '-'}
                  disabled
                />
              </div>
              <div className="profile-form-group profile-form-group-half">
                <label className="profile-form-label">
                  <Building size={18} />
                  Department
                </label>
                <input
                  type="text"
                  className="profile-form-input profile-form-input-disabled"
                  value={profile?.department?.name || '-'}
                  disabled
                />
              </div>
            </div>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Password Section */}
      <div className="profile-card profile-password-card">
        <div className="profile-password-header">
          <div>
            <h3 className="profile-password-title">Change Password</h3>
            <p className="profile-password-desc">Update your password to keep your account secure</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="profile-password-toggle"
          >
            <Key size={18} />
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="profile-password-form">
            {passwordError && (
              <div className="profile-password-error">{passwordError}</div>
            )}
            <div className="profile-form-group">
              <label className="profile-form-label">Current Password</label>
              <input
                type="password"
                className="profile-form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="profile-form-row">
              <div className="profile-form-group profile-form-group-half">
                <label className="profile-form-label">New Password</label>
                <input
                  type="password"
                  className="profile-form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="profile-form-group profile-form-group-half">
                <label className="profile-form-label">Confirm Password</label>
                <input
                  type="password"
                  className="profile-form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <p className="profile-password-hint">
              Must be at least 6 characters with uppercase, lowercase, and a number
            </p>
            <button
              type="submit"
              className="profile-save-btn profile-save-btn-secondary"
              disabled={passwordSaving}
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileBody />
    </RequireAuth>
  );
}