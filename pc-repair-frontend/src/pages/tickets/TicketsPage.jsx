import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Plus, Search, Filter, Loader } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import TextArea from '../../components/common/TextArea';
import { ticketsAPI } from '../../services/apiService';
import { formatRelativeTime, truncateText, handleApiError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: 'hardware',
    requires_visit: false,
    visit_address: '',
  });

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await ticketsAPI.getMyTickets(params);
      // Handle paginated response - tickets are in results array
      const ticketData = response.data.results || response.data;
      setTickets(Array.isArray(ticketData) ? ticketData : []);
    } catch (error) {
      toast.error(handleApiError(error));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await ticketsAPI.createTicket(formData);
      
      // Show success with rate limit info if available
      if (response.data?.limits) {
        const { pending_tickets, max_pending, tickets_today, daily_limit } = response.data.limits;
        toast.success(
          `Ticket created! (${pending_tickets}/${max_pending} pending, ${tickets_today}/${daily_limit} today)`
        );
      } else {
        toast.success('Ticket created successfully!');
      }
      
      setShowCreateModal(false);
      setFormData({ title: '', description: '', issue_type: 'hardware', requires_visit: false, visit_address: '' });
      fetchTickets();
    } catch (error) {
      // Handle rate limit errors with more helpful messages
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        if (errorData.cooldown_remaining_seconds) {
          const minutes = Math.ceil(errorData.cooldown_remaining_seconds / 60);
          toast.error(`Please wait ${minutes} minute(s) before creating another ticket.`, {
            duration: 5000,
          });
        } else {
          toast.error(handleApiError(error), { duration: 5000 });
        }
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Ticket className="w-8 h-8 mr-3 text-primary-600" />
              My Support Tickets
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage your support requests
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'waiting_parts', label: 'Waiting for Parts' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Tickets Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first support ticket to get help
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-mono text-gray-500">
                          #{ticket.ticket_number}
                        </span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      <p className="text-gray-900 mb-2 font-medium">
                        {truncateText(ticket.description || ticket.issue_description || 'No description', 150)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Created {formatRelativeTime(ticket.created_at)}</span>
                        {ticket.technician_name && (
                          <span>Assigned to: {ticket.technician_name}</span>
                        )}
                        {ticket.estimated_cost && (
                          <span className="font-semibold text-primary-600">
                            ${ticket.estimated_cost}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Support Ticket"
        size="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief summary of your issue"
            required
          />

          <TextArea
            label="Issue Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            placeholder="Please describe your issue in detail..."
            required
          />

          <Select
            label="Issue Type"
            name="issue_type"
            value={formData.issue_type}
            onChange={handleChange}
            options={[
              { value: 'hardware', label: 'Hardware Issue' },
              { value: 'software', label: 'Software Issue' },
            ]}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_visit"
              name="requires_visit"
              checked={formData.requires_visit}
              onChange={(e) => setFormData({ ...formData, requires_visit: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="requires_visit" className="ml-2 text-sm text-gray-700">
              I need a technician to visit my location
            </label>
          </div>

          {formData.requires_visit && (
            <TextArea
              label="Visit Address"
              name="visit_address"
              value={formData.visit_address || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Enter your complete address for the visit..."
              required={formData.requires_visit}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};

export default TicketsPage;
