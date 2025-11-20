import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/apiService';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

function ApplicationStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await authAPI.getMyApplication();
      if (response.data?.has_application === false || !response.data?.application) {
        toast.error('No application found. Redirecting to application form...');
        setTimeout(() => navigate('/technician/apply'), 2000);
      } else {
        setApplication(response.data.application || response.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No application found. Redirecting to application form...');
        setTimeout(() => navigate('/technician/apply'), 2000);
      } else {
        console.error('Error fetching application:', error);
        toast.error('Failed to load application status');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', text: 'Pending Review' },
      approved: { variant: 'success', text: 'Approved' },
      rejected: { variant: 'danger', text: 'Rejected' },
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: {
        type: 'info',
        title: 'Application Under Review',
        message: 'Your application is being reviewed by our admin team. You will receive an email notification once a decision has been made. This process typically takes 1-3 business days.',
      },
      approved: {
        type: 'success',
        title: 'Congratulations! 🎉',
        message: 'Your application has been approved! You are now a technician on our platform. You can start receiving ticket assignments from our admin team.',
      },
      rejected: {
        type: 'error',
        title: 'Application Not Approved',
        message: 'Unfortunately, your application was not approved at this time. Please review the feedback below and consider reapplying in the future with the suggested improvements.',
      },
    };
    return messages[status] || messages.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!application) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Card className="max-w-md">
            <Alert type="info">
              No application found. Redirecting to application form...
            </Alert>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const statusMessage = getStatusMessage(application.status);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Technician Application Status
        </h1>
        <p className="text-gray-600">
          View the status and details of your technician application.
        </p>
      </div>

      {/* Status Alert */}
      <Alert type={statusMessage.type} className="mb-6">
        <h3 className="font-semibold text-lg mb-1">{statusMessage.title}</h3>
        <p>{statusMessage.message}</p>
      </Alert>

      {/* Application Details */}
      <Card className="mb-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Applicant</label>
              <p className="text-gray-900 mt-1">
                {application.user_info?.first_name} {application.user_info?.last_name}
              </p>
              <p className="text-sm text-gray-500">{application.user_info?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Specialization</label>
              <p className="text-gray-900 mt-1">{application.specialization_display}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Years of Experience</label>
              <p className="text-gray-900 mt-1">{application.years_experience} years</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
              <p className="text-gray-900 mt-1">${application.hourly_rate}/hour</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-500">Bio</label>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">{application.bio}</p>
          </div>

          {/* Certifications */}
          {application.certifications && (
            <div>
              <label className="text-sm font-medium text-gray-500">Certifications</label>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{application.certifications}</p>
            </div>
          )}

          {/* Portfolio URL */}
          {application.portfolio_url && (
            <div>
              <label className="text-sm font-medium text-gray-500">Portfolio</label>
              <a
                href={application.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 mt-1 block"
              >
                {application.portfolio_url}
              </a>
            </div>
          )}

          {/* Submission Date */}
          <div>
            <label className="text-sm font-medium text-gray-500">Submitted On</label>
            <p className="text-gray-900 mt-1">{formatDate(application.created_at)}</p>
          </div>

          {/* Review Information (if reviewed) */}
          {application.reviewed_at && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reviewed By</label>
                  <p className="text-gray-900 mt-1">
                    {application.reviewed_by_info?.first_name} {application.reviewed_by_info?.last_name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Reviewed On</label>
                  <p className="text-gray-900 mt-1">{formatDate(application.reviewed_at)}</p>
                </div>
              </div>

              {/* Admin Notes */}
              {application.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Feedback</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{application.admin_notes}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
        
        {application.status === 'approved' && (
          <Button
            variant="primary"
            onClick={() => navigate('/technician/dashboard')}
          >
            Go to Technician Dashboard
          </Button>
        )}
        
        {application.status === 'rejected' && (
          <div className="flex flex-col gap-2 flex-1">
            <Button
              variant="primary"
              onClick={() => navigate('/technician/apply')}
            >
              Submit New Application
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Note: You can only reapply 30 days after your last application
            </p>
          </div>
        )}
      </div>
    </div>
    </MainLayout>
  );
}

export default ApplicationStatus;
