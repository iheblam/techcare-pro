import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Shield, Edit, Save, X, Camera, Upload } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatDate, handleApiError } from '../../utils/helpers';
import { authAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, isAdmin, isTechnician, isClient, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
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
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      await authAPI.updateProfile(formData);
      await refreshUser();
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setUploadingImage(false);
    }
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
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="w-24 h-24 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getUserTypeColor()} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              )}
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                title="Change profile picture"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
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
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
