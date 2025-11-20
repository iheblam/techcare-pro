import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Ticket, Calendar, User, DollarSign, MessageSquare, 
  Paperclip, Send, Loader, Clock, CheckCircle, Edit3 
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import TextArea from '../../components/common/TextArea';
import Modal from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ticketsAPI } from '../../services/apiService';
import { formatDateTime, formatRelativeTime, handleApiError, getStatusLabel, formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    estimated_cost: '',
    priority: '',
    admin_notes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    try {
      const response = await ticketsAPI.getTicketDetail(id);
      setTicket(response.data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSendingComment(true);
    try {
      await ticketsAPI.addComment(id, comment);
      setComment('');
      toast.success('Comment added');
      fetchTicketDetail();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSendingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);
    try {
      await ticketsAPI.uploadAttachment(id, file);
      toast.success('File uploaded successfully');
      fetchTicketDetail();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = () => {
    setEditData({
      title: ticket.title || '',
      estimated_cost: ticket.estimated_cost || '',
      priority: ticket.priority || 'medium',
      admin_notes: ticket.admin_notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateDetails = async () => {
    setUpdating(true);
    try {
      const updatePayload = {
        title: editData.title,
        estimated_cost: editData.estimated_cost ? parseFloat(editData.estimated_cost) : null,
        priority: editData.priority,
        admin_notes: editData.admin_notes
      };
      await ticketsAPI.updateTicketDetails(id, updatePayload);
      toast.success('Ticket details updated successfully');
      setShowEditModal(false);
      fetchTicketDetail();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setUpdating(false);
    }
  };

  const canEditDetails = user && (user.user_type === 'admin' || 
    (user.user_type === 'technician' && ticket?.assigned_technician === user.id));

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout>
        <Card className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ticket Not Found
          </h3>
          <Link to="/tickets">
            <Button variant="primary" className="mt-4">
              Back to Tickets
            </Button>
          </Link>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link to="/tickets">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      #{ticket.ticket_number}
                    </span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {ticket.title || 'Support Ticket'}
                  </h1>
                </div>
                {canEditDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Issue Description
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {ticket.description || ticket.issue_description || 'No description provided'}
                </p>
              </div>

              {ticket.admin_notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Admin Notes
                  </h3>
                  <p className="text-yellow-900 text-sm">{ticket.admin_notes}</p>
                </div>
              )}
            </Card>

            {/* Activity Timeline */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                Activity Timeline
              </h2>
              <div className="space-y-4">
                {ticket.updates && ticket.updates.length > 0 ? (
                  ticket.updates
                    .slice()
                    .reverse()
                    .map((update, index) => (
                    <div key={index} className="flex">
                      <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        update.status_changed_to ? 'bg-primary-600' : 'bg-gray-400'
                      }`}></div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {update.update_text}
                            </p>
                            {update.status_changed_to && (
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700">
                                {getStatusLabel(update.status_changed_to)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatRelativeTime(update.created_at)}
                          </span>
                        </div>
                        {update.user_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {update.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No activity yet</p>
                )}
              </div>
            </Card>

            {/* Comments Section */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
                Comments & Updates
              </h2>

              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {ticket.updates && ticket.updates.length > 0 ? (
                  ticket.updates.map((update, index) => (
                    <div key={index} className="border-l-2 border-primary-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {update.user_name || 'System'}
                          </span>
                          {update.user_type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              update.user_type === 'admin' ? 'bg-red-100 text-red-700' :
                              update.user_type === 'technician' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {update.user_type}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(update.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {update.update_text}
                      </p>
                      {update.status_changed_to && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">
                            Status: {getStatusLabel(update.status_changed_to)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No comments or updates yet</p>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="border-t pt-4">
                <TextArea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="mb-3"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={sendingComment}
                  disabled={!comment.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Comment
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ticket Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-900 font-medium">
                      {formatDateTime(ticket.created_at)}
                    </p>
                  </div>
                </div>

                {ticket.technician_name && (
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Technician</p>
                      <p className="text-gray-900 font-medium">
                        {ticket.technician_name}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.estimated_cost && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Estimated Cost</p>
                      <p className="text-gray-900 font-medium text-lg">
                        {formatCurrency(ticket.estimated_cost)}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.final_cost && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                    <div>
                      <p className="text-gray-500">Final Cost</p>
                      <p className="text-green-600 font-bold text-lg">
                        {formatCurrency(ticket.final_cost)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {ticket.technician_notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Technician Notes
                  </h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    {ticket.technician_notes}
                  </p>
                </div>
              )}
            </Card>

            {/* Attachments */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attachments
              </h3>
              
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {ticket.attachments.map((attachment, index) => {
                    const fileName = attachment.file_name || attachment.file?.split('/').pop() || 'Attachment';
                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {isImage ? (
                          <div>
                            <a
                              href={attachment.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={attachment.file}
                                alt={fileName}
                                className="w-full h-auto max-h-96 object-contain bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center p-4 bg-gray-50">
                                <Paperclip className="w-8 h-8 text-gray-400" />
                              </div>
                            </a>
                            <div className="p-2 bg-gray-50 border-t">
                              <a
                                href={attachment.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-700 hover:text-primary-600 flex items-center"
                              >
                                <Paperclip className="w-3 h-3 mr-1" />
                                {fileName}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={attachment.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                          >
                            <Paperclip className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-700 truncate flex-1">
                              {fileName}
                            </span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-4">No attachments</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingFile}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </Card>
          </div>
        </div>

        {/* Edit Details Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => !updating && setShowEditModal(false)}
          title="Edit Ticket Details"
        >
          <div className="space-y-4">
            <Input
              label="Ticket Title"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              placeholder="Enter ticket title"
            />

            <Input
              label="Estimated Cost ($)"
              type="number"
              step="0.01"
              min="0"
              value={editData.estimated_cost}
              onChange={(e) => setEditData({...editData, estimated_cost: e.target.value})}
              placeholder="Enter estimated cost"
            />

            <Select
              label="Priority"
              value={editData.priority}
              onChange={(e) => setEditData({...editData, priority: e.target.value})}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />

            <TextArea
              label="Admin Notes"
              value={editData.admin_notes}
              onChange={(e) => setEditData({...editData, admin_notes: e.target.value})}
              rows={4}
              placeholder="Add internal notes about this ticket..."
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateDetails}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default TicketDetailPage;
