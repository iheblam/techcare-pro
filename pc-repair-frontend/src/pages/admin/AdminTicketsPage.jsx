import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, Search, Filter, Trash2, Eye, UserCheck, 
  Loader, AlertTriangle, Edit 
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import TextArea from '../../components/common/TextArea';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ticketsAPI, issuesAPI } from '../../services/apiService';
import { formatRelativeTime, truncateText, handleApiError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [ticketToUpdate, setTicketToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Add to Issue Library state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [resolvedTicket, setResolvedTicket] = useState(null);
  const [issueCategories, setIssueCategories] = useState([]);
  const [issueData, setIssueData] = useState({
    title: '',
    description: '',
    solution: '',
    category_id: '',
    tags: ''
  });
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchIssueCategories();
  }, [statusFilter, priorityFilter]);

  const fetchIssueCategories = async () => {
    try {
      const response = await issuesAPI.getCategories();
      // API returns paginated response with results array
      const categories = response.data.results || [];
      console.log('Fetched categories:', categories);
      setIssueCategories(categories);
    } catch (error) {
      console.error('Failed to load issue categories:', error);
      setIssueCategories([]);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await ticketsAPI.getAllTickets(params);
      const ticketData = response.data.results || response.data;
      setTickets(Array.isArray(ticketData) ? ticketData : []);
    } catch (error) {
      toast.error(handleApiError(error));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;

    setDeleting(true);
    try {
      await ticketsAPI.deleteTicket(ticketToDelete.id);
      toast.success('Ticket deleted successfully');
      setShowDeleteModal(false);
      setTicketToDelete(null);
      fetchTickets();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusClick = (ticket) => {
    setTicketToUpdate(ticket);
    setNewStatus(ticket.status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!ticketToUpdate || !newStatus) return;

    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        update_note: statusNote,
        final_cost: finalCost ? parseFloat(finalCost) : null,
        technician_notes: technicianNotes
      };
      const response = await ticketsAPI.updateStatus(ticketToUpdate.id, updateData);
      toast.success('Ticket status updated successfully');
      setShowStatusModal(false);
      
      // Check if ticket was just resolved and show "Add to Issue Library" prompt
      if (response.data.resolved_now && response.data.can_add_to_library) {
        setResolvedTicket(ticketToUpdate);
        setIssueData({
          title: ticketToUpdate.title,
          description: ticketToUpdate.description,
          solution: technicianNotes || '',
          category_id: '',
          tags: ''
        });
        setShowIssueModal(true);
      }
      
      setTicketToUpdate(null);
      setNewStatus('');
      setStatusNote('');
      setFinalCost('');
      setTechnicianNotes('');
      fetchTickets();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!resolvedTicket || !issueData.category_id) {
      toast.error('Please select a category');
      return;
    }

    setAddingToLibrary(true);
    try {
      await ticketsAPI.createIssueFromTicket(resolvedTicket.id, issueData);
      toast.success('Issue added to library successfully!');
      setShowIssueModal(false);
      setResolvedTicket(null);
      setIssueData({ title: '', description: '', solution: '', category_id: '', tags: '' });
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setAddingToLibrary(false);
    }
  };

  const handleSkipLibrary = () => {
    setShowIssueModal(false);
    setResolvedTicket(null);
    setIssueData({ title: '', description: '', solution: '', category_id: '', tags: '' });
  };

  const filteredTickets = tickets.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.ticket_number?.toLowerCase().includes(searchLower) ||
      ticket.title?.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower) ||
      ticket.client_name?.toLowerCase().includes(searchLower)
    );
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_payment', label: 'Waiting Payment' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const getStatusCount = (status) => {
    if (status === 'all') return tickets.length;
    return tickets.filter(t => t.status === status).length;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Ticket className="w-8 h-8 mr-3 text-primary-600" />
            All Tickets Management
          </h1>
          <p className="text-gray-600 mt-1">
            View, manage, and delete all support tickets
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search Tickets
              </label>
              <Input
                type="text"
                placeholder="Search by ticket #, title, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={priorityOptions}
              />
            </div>
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {getStatusCount('pending')}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-purple-600">
              {getStatusCount('in_progress')}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-2xl font-bold text-green-600">
              {getStatusCount('resolved')}
            </div>
          </Card>
        </div>

        {/* Tickets List */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tickets List ({filteredTickets.length})
            </h2>
            <Button variant="outline" size="sm" onClick={fetchTickets}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No tickets found matching your filters'
                  : 'No tickets available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-mono font-medium text-gray-900">
                            #{ticket.ticket_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {truncateText(ticket.title || ticket.description || ticket.issue_description || 'No description', 50)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.client_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.assigned_technician_name ? (
                            <span className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-1 text-green-600" />
                              {ticket.assigned_technician_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(ticket.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusClick(ticket)}
                            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                            title="Update Status"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Link to={`/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ticket)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={ticket.status === 'resolved' || ticket.status === 'cancelled' 
                              ? "Delete Ticket" 
                              : "Only resolved/cancelled tickets can be deleted"}
                            disabled={ticket.status !== 'resolved' && ticket.status !== 'cancelled'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete Ticket"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Are you sure you want to delete this ticket?
              </p>
              <p className="text-sm text-red-700 mt-1">
                This action cannot be undone. All ticket data, messages, and files will be permanently deleted.
              </p>
            </div>
          </div>

          {ticketToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Ticket:</div>
              <div className="font-mono font-medium text-gray-900">
                #{ticketToDelete.ticket_number}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                {ticketToDelete.title || ticketToDelete.description || ticketToDelete.issue_description || 'No description'}
              </div>
              <div className="mt-2">
                <StatusBadge status={ticketToDelete.status} />
              </div>
            </div>
          )}

          {ticketToDelete && ticketToDelete.status !== 'resolved' && ticketToDelete.status !== 'cancelled' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Only resolved or cancelled tickets can be deleted. 
                This ticket is currently <strong>{ticketToDelete.status}</strong>.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting || (ticketToDelete && ticketToDelete.status !== 'resolved' && ticketToDelete.status !== 'cancelled')}
            >
              {deleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => !updating && setShowStatusModal(false)}
        title="Update Ticket Status"
      >
        <div className="space-y-4">
          {ticketToUpdate && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="text-sm text-gray-600">Ticket:</div>
              <div className="font-mono font-medium text-gray-900">
                #{ticketToUpdate.ticket_number}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                {ticketToUpdate.title || ticketToUpdate.description || ticketToUpdate.issue_description || 'No description'}
              </div>
            </div>
          )}

          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending Admin Review' },
              { value: 'assigned', label: 'Assigned to Technician' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'waiting_payment', label: 'Waiting for Payment' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          {(newStatus === 'waiting_payment' || newStatus === 'resolved') && (
            <Input
              label="Final Cost ($)"
              type="number"
              step="0.01"
              min="0"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              placeholder="Enter final cost (e.g., 150.00)"
            />
          )}

          <TextArea
            label="Technician Notes (Optional)"
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            rows={2}
            placeholder="Add internal notes about the repair work..."
          />

          <TextArea
            label="Status Update Note (Optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={3}
            placeholder="Add a note about this status change (visible to client)..."
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              disabled={updating || !newStatus}
            >
              {updating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add to Issue Library Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => !addingToLibrary && handleSkipLibrary()}
        title="Add to Issue Library"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Ticket Resolved!</strong> Would you like to add this solution to the Issue Library 
              so other users can benefit from it?
            </p>
          </div>

          <Input
            label="Issue Title *"
            value={issueData.title}
            onChange={(e) => setIssueData({ ...issueData, title: e.target.value })}
            placeholder="e.g., Computer Won't Boot After Power Outage"
          />

          <TextArea
            label="Problem Description *"
            value={issueData.description}
            onChange={(e) => setIssueData({ ...issueData, description: e.target.value })}
            rows={3}
            placeholder="Describe the problem that was encountered..."
          />

          <TextArea
            label="Solution *"
            value={issueData.solution}
            onChange={(e) => setIssueData({ ...issueData, solution: e.target.value })}
            rows={4}
            placeholder="Explain step-by-step how the issue was resolved..."
          />

          <Select
            label="Category *"
            value={issueData.category_id}
            onChange={(e) => {
              console.log('Category selected:', e.target.value);
              setIssueData({ ...issueData, category_id: e.target.value });
            }}
            options={(() => {
              const categoryOptions = Array.isArray(issueCategories) 
                ? issueCategories.map(cat => ({
                    value: cat.id,
                    label: `${cat.name} (${cat.category_type})`
                  }))
                : [];
              console.log('issueCategories:', issueCategories);
              console.log('Category options for Select:', categoryOptions);
              return [
                { value: '', label: 'Select a category' },
                ...categoryOptions
              ];
            })()}
          />

          <Input
            label="Tags (Optional)"
            value={issueData.tags}
            onChange={(e) => setIssueData({ ...issueData, tags: e.target.value })}
            placeholder="e.g., boot, power, startup (comma-separated)"
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleSkipLibrary}
              disabled={addingToLibrary}
            >
              Skip for Now
            </Button>
            <Button
              variant="primary"
              onClick={handleAddToLibrary}
              disabled={addingToLibrary || !issueData.category_id}
            >
              {addingToLibrary ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Library'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default AdminTicketsPage;
