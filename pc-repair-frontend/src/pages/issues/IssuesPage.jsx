import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ThumbsUp, Eye, Filter, Loader } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { issuesAPI } from '../../services/apiService';
import { formatRelativeTime, truncateText, handleApiError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await issuesAPI.getCategories();
      // API returns paginated response with results array
      setCategories(response.data.results || []);
    } catch (error) {
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let response;
      const params = {};
      
      // Add category filter if selected
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      // Add ordering based on sortBy
      if (sortBy === 'popular') {
        params.ordering = '-helpful_count';
      } else if (sortBy === 'recent') {
        params.ordering = '-created_at';
      } else if (sortBy === 'helpful') {
        params.ordering = '-helpful_count';
      }
      
      response = await issuesAPI.getIssues(params);
      
      // API returns paginated response with results array
      setIssues(response.data.results || response.data || []);
    } catch (error) {
      toast.error(handleApiError(error));
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchIssues();
      return;
    }

    setLoading(true);
    try {
      const response = await issuesAPI.getIssues({ search: searchTerm });
      // API returns paginated response with results array
      setIssues(response.data.results || response.data || []);
    } catch (error) {
      toast.error(handleApiError(error));
      setIssues([]);
    } finally {
      setLoading(false);
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
            <BookOpen className="w-8 h-8 mr-3 text-primary-600" />
            Issue Library
          </h1>
          <p className="text-gray-600">
            Browse thousands of resolved PC issues with detailed solutions
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <Button type="submit" variant="primary">
                Search
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
              />

              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'helpful', label: 'Most Helpful' },
                ]}
              />
            </div>
          </form>
        </Card>

        {/* Issues List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : issues.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Issues Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <Link key={issue.id} to={`/issues/${issue.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`badge ${getCategoryBadgeColor(
                            issue.category_type
                          )}`}
                        >
                          {issue.category_name}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
                        {issue.title}
                      </h3>

                      <p className="text-gray-600 mb-3">
                        {truncateText(issue.description, 200)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {issue.views || 0} views
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {issue.helpful_count || 0} helpful
                        </div>
                        <span>{formatRelativeTime(issue.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IssuesPage;
