import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, ThumbsUp, Eye, ArrowLeft, Lightbulb, 
  CheckCircle, Calendar, Loader, Trash2 
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { issuesAPI } from '../../services/apiService';
import { formatDateTime, handleApiError } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [similarIssues, setSimilarIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingHelpful, setMarkingHelpful] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIssueDetail();
    fetchSimilarIssues();
  }, [id]);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const response = await issuesAPI.getIssueDetail(id);
      setIssue(response.data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarIssues = async () => {
    try {
      const response = await issuesAPI.getSimilarIssues(id);
      setSimilarIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch similar issues:', error);
    }
  };

  const handleMarkHelpful = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to mark as helpful');
      return;
    }

    setMarkingHelpful(true);
    try {
      const response = await issuesAPI.markHelpful(id);
      setIssue({ ...issue, helpful_count: response.data.helpful_count });
      toast.success('Marked as helpful!');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setMarkingHelpful(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue from the library? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await issuesAPI.deleteIssue(id);
      toast.success('Issue deleted successfully');
      navigate('/issues');
    } catch (error) {
      toast.error(handleApiError(error));
      setDeleting(false);
    }
  };

  const getCategoryBadgeColor = (categoryType) => {
    const colors = {
      hardware: 'bg-red-100 text-red-800',
      software: 'bg-blue-100 text-blue-800',
      both: 'bg-purple-100 text-purple-800',
    };
    return colors[categoryType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </MainLayout>
    );
  }

  if (!issue) {
    return (
      <MainLayout>
        <Card className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Issue Not Found
          </h3>
          <Link to="/issues">
            <Button variant="primary" className="mt-4">
              Back to Issues
            </Button>
          </Link>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/issues">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Issues
          </Button>
        </Link>

        {/* Issue Header */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${getCategoryBadgeColor(issue.category_type)}`}>
                  {issue.category_name}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {issue.title}
              </h1>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {issue.views || 0} views
                </div>
                <div className="flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {issue.helpful_count || 0} helpful
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDateTime(issue.created_at)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleMarkHelpful}
                loading={markingHelpful}
                disabled={!isAuthenticated}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Helpful
              </Button>
              
              {user?.user_type === 'admin' && (
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Problem Description */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Problem Description
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
        </Card>

        {/* Solution */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Solution
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{issue.solution}</p>
          </div>
        </Card>

        {/* Prevention Tips */}
        {issue.prevention_tips && (
          <Alert type="info" className="mb-6">
            <strong className="block mb-2">Prevention Tips:</strong>
            <p className="whitespace-pre-wrap">{issue.prevention_tips}</p>
          </Alert>
        )}

        {/* Similar Issues */}
        {similarIssues.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Similar Issues
            </h2>
            <div className="space-y-3">
              {similarIssues.map((similar) => (
                <Link
                  key={similar.id}
                  to={`/issues/${similar.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">
                    {similar.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {similar.helpful_count}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {similar.view_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default IssueDetailPage;
