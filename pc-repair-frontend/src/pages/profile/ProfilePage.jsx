import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Edit, Save, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Avatar options using DiceBear API
const AVATAR_OPTIONS = [
  { id: 'avataaars-1', label: 'Male 1' },
  { id: 'avataaars-2', label: 'Male 2' },
  { id: 'avataaars-3', label: 'Male 3' },
  { id: 'avataaars-4', label: 'Male 4' },
  { id: 'avataaars-5', label: 'Male 5' },
  { id: 'avataaars-6', label: 'Male 6' },
  { id: 'avataaars-7', label: 'Female 1' },
  { id: 'avataaars-8', label: 'Female 2' },
  { id: 'avataaars-9', label: 'Female 3' },
  { id: 'avataaars-10', label: 'Female 4' },
  { id: 'avataaars-11', label: 'Female 5' },
  { id: 'avataaars-12', label: 'Female 6' },
];

const ProfilePage = () => {
  const { user, updateProfile, isAdmin, isTechnician, isClient } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar: user?.avatar || 'avataaars-1',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateProfile(formData);
    if (success) {
      setEditing(false);
      toast.success('Profile updated successfully!');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      avatar: user?.avatar || 'avataaars-1',
    });
    setEditing(false);
  };

  const handleAvatarSelect = async (avatarId) => {
    setLoading(true);
    const success = await updateProfile({ avatar: avatarId });
    if (success) {
      setFormData({ ...formData, avatar: avatarId });
      setShowAvatarPicker(false);
      toast.success('Avatar updated successfully!');
    }
    setLoading(false);
  };

  const getUserTypeBadge = () => {
    if (isAdmin) {
      return <Badge variant="error">Admin</Badge>;
    } else if (isTechnician) {
      return <Badge variant="warning">Technician</Badge>;
    } else {
      return <Badge variant="info">Client</Badge>;
    }
  };

  const getUserTypeColor = () => {
    if (isAdmin) return 'from-red-500 to-red-600';
    if (isTechnician) return 'from-orange-500 to-orange-600';
    return 'from-primary-500 to-primary-600';
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="w-8 h-8 mr-3 text-primary-600" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatar || 'avataaars-1'}`}
                alt={user?.full_name}
                className="w-24 h-24 rounded-full object-cover shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowAvatarPicker(true)}
                title="Click to change avatar"
              />
              
              {/* Edit Icon */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                title="Change avatar"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.full_name || `${user?.first_name} ${user?.last_name}`}
                </h2>
                {getUserTypeBadge()}
              </div>
              <p className="text-gray-600 mb-1">@{user?.username}</p>
              <p className="text-sm text-gray-500">
                Member since {formatDate(user?.created_at)}
              </p>
            </div>

            {/* Edit Button */}
            {!editing && (
              <Button variant="primary" onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-600" />
            Account Information
          </h3>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="First Name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  icon={User}
                  required
                />

                <Input
                  label="Last Name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  icon={User}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={Phone}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <p className="text-gray-900">{user?.first_name || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <p className="text-gray-900">{user?.last_name || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{user?.phone || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">@{user?.username}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900 capitalize">{user?.user_type}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Choose Your Avatar</h3>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleAvatarSelect(avatar.id)}
                      disabled={loading}
                      className={`relative p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        (user?.avatar || formData.avatar) === avatar.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.id}`}
                        alt={avatar.label}
                        className="w-full h-auto rounded-lg"
                      />
                      <p className="text-xs text-center mt-2 font-medium text-gray-700">
                        {avatar.label}
                      </p>
                      {(user?.avatar || formData.avatar) === avatar.id && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
