import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, Ticket, Clock, CheckCircle, Loader, 
  TrendingUp 
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import TextArea from '../../components/common/TextArea';
import { ticketsAPI } from '../../services/apiService';
import { formatRelativeTime, truncateText, handleApiError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TechnicianDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketsAPI.getAssignedTickets();
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(handleApiError(error));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      await ticketsAPI.updateStatus(selectedTicket.id, newStatus, statusNotes);
      toast.success('Status updated successfully');
      setShowStatusModal(false);
      setSelectedTicket(null);
      setNewStatus('');
      setStatusNotes('');
      fetchTickets();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setUpdating(false);
    }
  };

  const getStatusCounts = () => {
    return {
      total: tickets.length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      waiting: tickets.filter(t => t.status === 'waiting_parts').length,
      completed: tickets.filter(t => t.status === 'completed').length,
    };
  };

  const counts = getStatusCounts();

  const statCards = [
    { label: 'Assigned to Me', value: counts.total, icon: Ticket, color: 'bg-blue-500' },
    { label: 'In Progress', value: counts.in_progress, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Waiting for Parts', value: counts.waiting, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Completed', value: counts.completed, icon: CheckCircle, color: 'bg-green-500' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Wrench className="w-8 h-8 mr-3 text-primary-600" />
            Technician Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your assigned tickets and workflows
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tickets List */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            My Assigned Tickets
          </h2>

          {!Array.isArray(tickets) || tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
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
                        <span>Client: {ticket.client_name}</span>
                        <span>{formatRelativeTime(ticket.created_at)}</span>
                        {ticket.estimated_cost && (
                          <span className="font-semibold text-primary-600">
                            ${ticket.estimated_cost}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link to={`/tickets/${ticket.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {ticket.status !== 'completed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setNewStatus(ticket.status);
                            setShowStatusModal(true);
                          }}
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedTicket(null);
          setNewStatus('');
          setStatusNotes('');
        }}
        title="Update Ticket Status"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedTicket(null);
                setNewStatus('');
                setStatusNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateStatus}
              loading={updating}
            >
              Update Status
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                Ticket #{selectedTicket.ticket_number}
              </p>
              <p className="text-gray-900">
                {truncateText(selectedTicket.description || selectedTicket.issue_description || 'No description', 150)}
              </p>
            </div>

            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'approved', label: 'Approved' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'waiting_parts', label: 'Waiting for Parts' },
                { value: 'completed', label: 'Completed' },
              ]}
            />

            <TextArea
              label="Notes (Optional)"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes about this status update..."
            />
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default TechnicianDashboard;
