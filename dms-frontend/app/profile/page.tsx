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
import { useLocale } from '@/lib/i18n/locale-provider';
import { Camera, Loader2, User, Mail, Building, Shield, Key, Trash2, Check } from 'lucide-react';

function ProfileBody() {
  const { user, setSession, token, refreshUser } = useAuth();
  const { notify } = useToast();
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Truthy when the user has a profile picture stored in the DB (we get
  // back the mime type, not a filename, now that bytes live in Postgres).
  const [hasProfilePicture, setHasProfilePicture] = useState<string | null>(null);
  // Object URL for the actual image bytes, fetched from the authenticated
  // GET /profile/picture endpoint (a plain <img src="..."> can't send the
  // Authorization header, so we fetch it as a blob ourselves).
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

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

  // Whenever the user has a picture, fetch its bytes as a blob URL.
  // Whenever they don't (or on unmount), clean up the previous object URL.
  useEffect(() => {
    let activeUrl: string | null = null;
    let cancelled = false;

    if (hasProfilePicture) {
      profileApi
        .getPictureUrl()
        .then(({ url }) => {
          if (cancelled) {
            window.URL.revokeObjectURL(url);
            return;
          }
          activeUrl = url;
          setPictureUrl(url);
          setImageError(false);
        })
        .catch(() => {
          if (!cancelled) setPictureUrl(null);
        });
    } else {
      setPictureUrl(null);
    }

    return () => {
      cancelled = true;
      if (activeUrl) window.URL.revokeObjectURL(activeUrl);
    };
  }, [hasProfilePicture]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.get();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
      setHasProfilePicture(data.profilePictureMime);
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
      const updated = await profileApi.update({ name, email });
      setProfile(updated);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            name: updated.name,
            email: updated.email,
          },
        });
      }
      await refreshUser();
      notify(t('profile.profileUpdated'), 'success');
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
      notify(t('profile.onlyImageTypes'), 'error');
      return;
    }

    if (file.size > maxSize) {
      notify(t('profile.imageTooLarge'), 'error');
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
      setHasProfilePicture(updated.profilePictureMime);
      setImageError(false);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            profilePictureMime: updated.profilePictureMime,
          },
        });
      }
      await refreshUser();
      notify(t('profile.pictureUpdated'), 'success');
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
      setHasProfilePicture(null);
      setImageError(false);
      if (user) {
        setSession({
          accessToken: token!,
          mustChangePassword: false,
          user: {
            ...user,
            profilePictureMime: null,
          },
        });
      }
      await refreshUser();
      notify(t('profile.pictureRemoved'), 'success');
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
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('profile.passwordTooShort'));
      return;
    }

    setPasswordSaving(true);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      notify(t('profile.passwordChanged'), 'success');
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

  const imageUrl = !imageError ? pictureUrl : null;

  return (
    <div className="profile-page">
      {showConfirmDialog && (
        <ConfirmDialog
          title={t('profile.removePictureTitle')}
          message={t('profile.removePictureConfirm')}
          confirmLabel={t('profile.remove')}
          danger
          loading={confirmLoading}
          onConfirm={confirmRemovePicture}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
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
                {hasProfilePicture ? t('profile.changePhoto') : t('profile.uploadPhoto')}
              </button>
              {hasProfilePicture && (
                <button
                  onClick={handleRemovePicture}
                  disabled={uploading}
                  className="profile-avatar-btn profile-avatar-btn-danger"
                >
                  <Trash2 size={16} />
                  {t('profile.remove')}
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
                {t('profile.fullName')}
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
                {t('profile.emailAddress')}
              </label>
              <input
                type="email"
                className="profile-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="profile-form-hint">{t('profile.emailCannotChange')}</span>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group profile-form-group-half">
                <label className="profile-form-label">
                  <Shield size={18} />
                  {t('profile.role')}
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
                  {t('profile.department')}
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
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Check size={18} />
                  {t('profile.saveChanges')}
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
            <h3 className="profile-password-title">{t('profile.changePassword')}</h3>
            <p className="profile-password-desc">{t('profile.changePasswordDesc')}</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="profile-password-toggle"
          >
            <Key size={18} />
            {showPasswordForm ? t('profile.cancel') : t('profile.changePassword')}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="profile-password-form">
            {passwordError && (
              <div className="profile-password-error">{passwordError}</div>
            )}
            <div className="profile-form-group">
              <label className="profile-form-label">{t('profile.currentPassword')}</label>
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
                <label className="profile-form-label">{t('profile.newPassword')}</label>
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
                <label className="profile-form-label">{t('profile.confirmPassword')}</label>
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
              {t('profile.passwordHint')}
            </p>
            <button
              type="submit"
              className="profile-save-btn profile-save-btn-secondary"
              disabled={passwordSaving}
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.updating')}
                </>
              ) : (
                t('profile.updatePassword')
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
