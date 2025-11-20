import { useState, useEffect } from 'react';
import { authAPI } from '../../services/apiService';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import TextArea from '../../components/common/TextArea';
import toast from 'react-hot-toast';

function AdminApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    application: null,
    action: null, // 'approve' or 'reject'
    adminNotes: '',
    loading: false,
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await authAPI.getAdminApplications(params);
      setApplications(response.data.applications || []);
      setStatistics(response.data.statistics || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (application, action) => {
    setReviewModal({
      isOpen: true,
      application,
      action,
      adminNotes: '',
      loading: false,
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      application: null,
      action: null,
      adminNotes: '',
      loading: false,
    });
  };

  const handleReview = async () => {
    if (!reviewModal.application || !reviewModal.action) return;

    // Validate admin notes for rejection
    if (reviewModal.action === 'reject' && !reviewModal.adminNotes.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    setReviewModal(prev => ({ ...prev, loading: true }));

    try {
      await authAPI.reviewApplication(reviewModal.application.id, {
        status: reviewModal.action === 'approve' ? 'approved' : 'rejected',
        admin_notes: reviewModal.adminNotes,
      });

      const actionText = reviewModal.action === 'approve' ? 'approved' : 'rejected';
      toast.success(`Application ${actionText} successfully`);
      
      closeReviewModal();
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error(error.response?.data?.error || 'Failed to review application');
    } finally {
      setReviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', text: 'Pending' },
      approved: { variant: 'success', text: 'Approved' },
      rejected: { variant: 'danger', text: 'Rejected' },
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatCard = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color} bg-white`}>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const ApplicationCard = ({ application }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {application.user_info?.first_name} {application.user_info?.last_name}
            </h3>
            <p className="text-sm text-gray-600">{application.user_info?.email}</p>
          </div>
          {getStatusBadge(application.status)}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Specialization</p>
            <p className="font-medium text-gray-900">{application.specialization_display}</p>
          </div>
          <div>
            <p className="text-gray-500">Experience</p>
            <p className="font-medium text-gray-900">{application.years_experience} years</p>
          </div>
          <div>
            <p className="text-gray-500">Hourly Rate</p>
            <p className="font-medium text-gray-900">${application.hourly_rate}/hr</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium text-gray-900">{formatDate(application.created_at)}</p>
          </div>
        </div>

        {/* Bio Preview */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Bio:</p>
          <p className="text-sm text-gray-900 line-clamp-2">{application.bio}</p>
        </div>

        {/* Certifications */}
        {application.certifications && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Certifications:</p>
            <p className="text-sm text-gray-900 line-clamp-1">{application.certifications}</p>
          </div>
        )}

        {/* Portfolio Link */}
        {application.portfolio_url && (
          <a
            href={application.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            View Portfolio
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Review Info (if reviewed) */}
        {application.reviewed_at && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-1">
              Reviewed by {application.reviewed_by_info?.first_name} {application.reviewed_by_info?.last_name} on {formatDate(application.reviewed_at)}
            </p>
            {application.admin_notes && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{application.admin_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions (only for pending applications) */}
        {application.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="success"
              size="sm"
              onClick={() => openReviewModal(application, 'approve')}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openReviewModal(application, 'reject')}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Technician Applications
        </h1>
        <p className="text-gray-600">
          Review and manage technician applications from users.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Applications"
          value={statistics?.total || 0}
          color="border-blue-500"
        />
        <StatCard
          title="Pending Review"
          value={statistics?.pending || 0}
          color="border-yellow-500"
        />
        <StatCard
          title="Approved"
          value={statistics?.approved || 0}
          color="border-green-500"
        />
        <StatCard
          title="Rejected"
          value={statistics?.rejected || 0}
          color="border-red-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                filter === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter !== 'all' 
                ? `No ${filter} applications at this time.`
                : 'No technician applications have been submitted yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map(application => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        title={`${reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Application`}
      >
        {reviewModal.application && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Applicant</p>
              <p className="font-medium">
                {reviewModal.application.user_info?.first_name} {reviewModal.application.user_info?.last_name}
              </p>
            </div>

            <TextArea
              label={reviewModal.action === 'approve' ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}
              value={reviewModal.adminNotes}
              onChange={(e) => setReviewModal(prev => ({ ...prev, adminNotes: e.target.value }))}
              placeholder={
                reviewModal.action === 'approve'
                  ? 'Add any notes for the applicant...'
                  : 'Please provide a reason for rejection. This will be sent to the applicant.'
              }
              rows={4}
              required={reviewModal.action === 'reject'}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={closeReviewModal}
                disabled={reviewModal.loading}
              >
                Cancel
              </Button>
              <Button
                variant={reviewModal.action === 'approve' ? 'success' : 'danger'}
                onClick={handleReview}
                disabled={reviewModal.loading}
              >
                {reviewModal.loading
                  ? 'Processing...'
                  : reviewModal.action === 'approve'
                  ? 'Approve Application'
                  : 'Reject Application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </MainLayout>
  );
}

export default AdminApplicationsPage;
