import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Ticket, Users, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Loader 
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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicianId, setTechnicianId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        ticketsAPI.getDashboardStats(),
        ticketsAPI.getPendingTickets(),
      ]);
      setStats(statsRes.data);
      // Handle paginated response - tickets are in results array
      const tickets = pendingRes.data.results || pendingRes.data;
      setPendingTickets(Array.isArray(tickets) ? tickets : []);
    } catch (error) {
      toast.error(handleApiError(error));
      setPendingTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!technicianId) {
      toast.error('Please select a technician');
      return;
    }

    setAssigning(true);
    try {
      await ticketsAPI.assignTicket(selectedTicket.id, technicianId);
      toast.success('Ticket assigned successfully');
      setShowAssignModal(false);
      setSelectedTicket(null);
      setTechnicianId('');
      fetchData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setAssigning(false);
    }
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

  const statCards = [
    {
      label: 'Total Tickets',
      value: stats?.tickets?.total || 0,
      icon: Ticket,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Pending',
      value: stats?.tickets?.pending || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      label: 'In Progress',
      value: stats?.tickets?.in_progress || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      label: 'Resolved',
      value: stats?.tickets?.resolved || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <LayoutDashboard className="w-8 h-8 mr-3 text-primary-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage tickets, technicians, and system overview
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

        {/* Pending Tickets */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Pending Tickets ({pendingTickets.length})
            </h2>
            <Link to="/admin/tickets">
              <Button variant="outline" size="sm">
                Manage All Tickets
              </Button>
            </Link>
          </div>

          {!Array.isArray(pendingTickets) || pendingTickets.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No pending tickets</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTickets.map((ticket) => (
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
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      <p className="text-gray-900 mb-2">
                        {truncateText(ticket.description || ticket.issue_description || 'No description', 120)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Client: {ticket.client_name}</span>
                        <span>{formatRelativeTime(ticket.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link to={`/tickets/${ticket.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowAssignModal(true);
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Assign Ticket Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTicket(null);
          setTechnicianId('');
        }}
        title="Assign Ticket to Technician"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedTicket(null);
                setTechnicianId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignTicket}
              loading={assigning}
            >
              Assign Ticket
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Ticket #{selectedTicket.ticket_number}</p>
              <p className="text-gray-900">{truncateText(selectedTicket.description || selectedTicket.issue_description || 'No description', 150)}</p>
            </div>

            <Select
              label="Select Technician"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              options={[
                { value: '', label: 'Choose a technician...' },
                ...(stats?.technicians || []).map((tech) => ({
                  value: tech.id,
                  label: `${tech.name} (${tech.active_tickets} active tickets)`,
                })),
              ]}
            />
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default AdminDashboard;
