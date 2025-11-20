import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/apiService';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import TextArea from '../../components/common/TextArea';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function TechnicianApplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasApplication, setHasApplication] = useState(false);
  
  const [formData, setFormData] = useState({
    specialization: '',
    years_experience: '',
    bio: '',
    certifications: '',
    portfolio_url: '',
    hourly_rate: '',
  });

  const [errors, setErrors] = useState({});

  const specializationChoices = [
    { value: 'hardware', label: 'Hardware Repair' },
    { value: 'software', label: 'Software Troubleshooting' },
    { value: 'both', label: 'Hardware & Software' },
  ];

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const response = await authAPI.getMyApplication();
      const application = response.data?.application;
      
      // Only block if application exists and is pending or approved
      if (application && (application.status === 'pending' || application.status === 'approved')) {
        setHasApplication(true);
        toast(`You already have a ${application.status} application. Redirecting...`, { icon: 'ℹ️' });
        setTimeout(() => navigate('/technician/application-status'), 2000);
      }
      // If rejected, user can reapply (30-day check will happen on submit)
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error checking application status:', error);
      }
      // 404 means no application exists, which is fine
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.specialization) {
      newErrors.specialization = 'Please select a specialization';
    }

    if (!formData.years_experience) {
      newErrors.years_experience = 'Years of experience is required';
    } else if (parseInt(formData.years_experience) < 0) {
      newErrors.years_experience = 'Years of experience cannot be negative';
    }

    if (!formData.bio || formData.bio.trim().length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (!formData.hourly_rate) {
      newErrors.hourly_rate = 'Hourly rate is required';
    } else if (parseFloat(formData.hourly_rate) < 10 || parseFloat(formData.hourly_rate) > 500) {
      newErrors.hourly_rate = 'Hourly rate must be between $10 and $500';
    }

    if (formData.portfolio_url && !isValidUrl(formData.portfolio_url)) {
      newErrors.portfolio_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      await authAPI.submitTechnicianApplication({
        ...formData,
        years_experience: parseInt(formData.years_experience),
        hourly_rate: parseFloat(formData.hourly_rate),
      });

      toast.success('Application submitted successfully! You will be notified when it is reviewed.');
      navigate('/technician/application-status');
    } catch (error) {
      console.error('Error submitting application:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle 30-day restriction error
        if (errorData.days_remaining) {
          const reapplyDate = new Date(errorData.can_reapply_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          toast.error(`You can reapply in ${errorData.days_remaining} days (${reapplyDate})`);
          return;
        }
        
        // Handle general error message
        if (errorData.error) {
          toast.error(errorData.error);
          return;
        }
        
        // Handle field-specific errors from backend
        const backendErrors = {};
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            backendErrors[key] = errorData[key][0];
          } else {
            backendErrors[key] = errorData[key];
          }
        });
        setErrors(backendErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (hasApplication) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Card className="max-w-md">
            <Alert type="info">
              You already have an application. Redirecting to status page...
            </Alert>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Apply to Become a Technician
        </h1>
        <p className="text-gray-600">
          Fill out the form below to apply. Our admin team will review your application and get back to you soon.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Specialization */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Specialization *
            </label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className={`input ${errors.specialization ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              required
            >
              <option value="">Select your specialization</option>
              {specializationChoices.map(choice => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
            {errors.specialization && (
              <p className="mt-1.5 text-sm text-red-600">{errors.specialization}</p>
            )}
          </div>

          {/* Years of Experience */}
          <Input
            label="Years of Experience *"
            type="number"
            name="years_experience"
            value={formData.years_experience}
            onChange={handleChange}
            error={errors.years_experience}
            placeholder="e.g., 5"
            min="0"
            required
          />

          {/* Bio */}
          <TextArea
            label="Bio *"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            error={errors.bio}
            placeholder="Tell us about your experience, skills, and what makes you a great technician... (minimum 50 characters)"
            rows={6}
            required
            helperText={`${formData.bio.length} / 50 characters minimum`}
          />

          {/* Certifications */}
          <TextArea
            label="Certifications (Optional)"
            name="certifications"
            value={formData.certifications}
            onChange={handleChange}
            error={errors.certifications}
            placeholder="List any relevant certifications (e.g., CompTIA A+, Network+, etc.)"
            rows={3}
          />

          {/* Portfolio URL */}
          <Input
            label="Portfolio URL (Optional)"
            type="url"
            name="portfolio_url"
            value={formData.portfolio_url}
            onChange={handleChange}
            error={errors.portfolio_url}
            placeholder="https://yourportfolio.com"
          />

          {/* Hourly Rate */}
          <Input
            label="Hourly Rate (USD) *"
            type="number"
            name="hourly_rate"
            value={formData.hourly_rate}
            onChange={handleChange}
            error={errors.hourly_rate}
            placeholder="e.g., 50"
            min="10"
            max="500"
            step="0.01"
            required
            helperText="Enter your desired hourly rate ($10 - $500)"
          />

          {/* Info Alert */}
          <Alert type="info">
            <strong>Note:</strong> All fields marked with * are required. Your application will be reviewed by our admin team. You will receive an email notification once your application has been processed.
          </Alert>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </MainLayout>
  );
}

export default TechnicianApplicationForm;
