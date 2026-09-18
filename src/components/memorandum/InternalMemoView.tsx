import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { InternalMemo, MemoAttachment, UserRole, MemoPriority } from '../../types';
import { 
  Mail, 
  Send, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  X, 
  Plus, 
  User, 
  Users, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Eye
} from 'lucide-react';

export const InternalMemoView: React.FC = () => {
  const { 
    internalMemos, 
    addInternalMemo, 
    markMemoAsRead, 
    deleteInternalMemo, 
    users, 
    currentUser 
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // New Memo Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recipientType, setRecipientType] = useState<'user' | 'role' | 'all'>('user');
  const [selectedUserId, setSelectedUserId] = useState(users[1]?.id || users[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState<UserRole>('head_kitchen');
  const [priority, setPriority] = useState<MemoPriority>('Penting');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MemoAttachment[]>([]);

  // Selected Memo Modal for Reading
  const [readingMemo, setReadingMemo] = useState<InternalMemo | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // File Upload Handler for Memo Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const isImg = file.type.startsWith('image/');
      const newAtt: MemoAttachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileType: isImg ? 'image' : 'document',
        fileUrl: reader.result as string,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmitMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Judul dan isi memo wajib diisi!');
      return;
    }

    let recipientId = 'ALL';
    let recipientName = 'Semua Karyawan (Broadcast)';
    let recRole: UserRole | 'all' = 'all';

    if (recipientType === 'user') {
      const u = users.find(user => user.id === selectedUserId);
      if (u) {
        recipientId = u.id;
        recipientName = `${u.name} (${u.role.toUpperCase()})`;
        recRole = u.role;
      }
    } else if (recipientType === 'role') {
      recipientId = `ROLE_${selectedRole.toUpperCase()}`;
      recipientName = `Divisi / Tim ${selectedRole.toUpperCase()}`;
      recRole = selectedRole;
    }

    addInternalMemo({
      date: new Date().toISOString().slice(0, 10),
      subject: title.trim(),
      title: title.trim(),
      content: content.trim(),
      senderId: currentUser.id,
      senderName: `${currentUser.name} (${currentUser.role === 'manager' ? 'Manager' : currentUser.role})`,
      senderRole: currentUser.role,
      recipientType,
      recipientId,
      recipientName,
      recipientRole: recRole,
      priority,
      attachments: attachments.length > 0 ? attachments : undefined,
      attachmentName: attachments[0]?.fileName,
      attachmentUrl: attachments[0]?.fileUrl,
      attachmentType: attachments[0]?.fileType,
    });

    setShowCreateModal(false);
    setTitle('');
    setContent('');
    setAttachments([]);
    alert('Memorandum berhasil dikirim ke akun/divisi yang dipilih.');
  };

  // Open memo to read
  const handleOpenMemo = (memo: InternalMemo) => {
    setReadingMemo(memo);
    if (!memo.readBy.includes(currentUser.id)) {
      markMemoAsRead(memo.id, currentUser.id);
    }
  };

  // Filtered lists
  const inboxMemos = internalMemos.filter(m => {
    // Current user can read if it's sent to them, their role, or broadcast 'all'
    if (m.recipientType === 'all' || m.recipientRole === 'all' || m.recipientId === 'ALL') {
      return true;
    }
    if (m.recipientId && m.recipientId === currentUser.id) return true;
    if (m.recipientRole && m.recipientRole === currentUser.role) return true;
    if (m.recipientId === `ROLE_${currentUser.role.toUpperCase()}`) return true;
    // Manager or Master Admin can monitor all incoming memos
    if (isMasterOrManager) return true;
    return false;
  });

  const sentMemos = internalMemos.filter(m => {
    if (isMasterOrManager) {
      // Manager/Admin can view all memos dispatched in the outlet or authored by them
      return true;
    }
    return m.senderId === currentUser.id;
  });

  const displayedMemos = (activeTab === 'inbox' ? inboxMemos : sentMemos).filter(m => {
    const titleText = (m.title || m.subject || '').toLowerCase();
    const contentText = (m.content || '').toLowerCase();
    const senderText = (m.senderName || '').toLowerCase();
    const recipientText = (m.recipientName || (m.recipientRole ? `Divisi ${m.recipientRole}` : 'Semua Divisi')).toLowerCase();
    const memoNum = (m.memoNumber || '').toLowerCase();
    const s = searchTerm.toLowerCase();

    const matchesSearch = titleText.includes(s) ||
                          contentText.includes(s) ||
                          senderText.includes(s) ||
                          recipientText.includes(s) ||
                          memoNum.includes(s);

    if (priorityFilter === 'all') return matchesSearch;
    return matchesSearch && m.priority === priorityFilter;
  });

  const unreadCount = inboxMemos.filter(m => !m.readBy.includes(currentUser.id)).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Memorandum & Pesan Internal Outlet</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse">
                {unreadCount} Memo Baru Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instruksi operasional dari Manager ke akun karyawan/divisi tertentu disertai lampiran berkas dokumen & foto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMasterOrManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>+ Buat Memorandum Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Tab Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-xl bg-slate-100 p-1 shrink-0 border border-slate-200">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'inbox' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Kotak Masuk ({inboxMemos.length})</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Terkirim ({sentMemos.length})</span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari perihal, pengirim, penerima, atau isi memo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Urgent / Segera', 'Penting', 'Normal'].map(pr => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                priorityFilter === pr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pr === 'all' ? 'Semua Prioritas' : pr}
            </button>
          ))}
        </div>
      </div>

      {/* Memos List */}
      <div className="space-y-3">
        {displayedMemos.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              {activeTab === 'sent' ? <Send className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <p className="font-bold text-slate-700 text-sm">
              {activeTab === 'sent' 
                ? 'Belum ada memorandum yang terkirim' 
                : 'Tidak ada memorandum di kotak masuk'}
            </p>
            <p className="text-slate-400 max-w-sm mx-auto">
              {activeTab === 'sent'
                ? 'Semua surat instruksi operasional resmi yang Anda atau pihak Management kirimkan akan tercatat di sini.'
                : 'Pesan dan memorandum operasional yang ditujukan ke divisi atau akun Anda akan tampil di sini.'}
            </p>
            {isMasterOrManager && activeTab === 'sent' && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold inline-flex items-center gap-2 text-xs"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Tulis Memorandum Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          displayedMemos.map(memo => {
            const isRead = memo.readBy.includes(currentUser.id);
            const isUrgent = memo.priority === 'Urgent / Segera';
            const isImportant = memo.priority === 'Penting';
            const recipientLabel = memo.recipientName || (memo.recipientRole === 'all' ? 'Semua Divisi & Karyawan' : `Divisi ${memo.recipientRole}`) || 'Semua Divisi';

            return (
              <div
                key={memo.id}
                onClick={() => handleOpenMemo(memo)}
                className={`bg-white rounded-2xl border p-4.5 cursor-pointer transition-all hover:shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  !isRead 
                    ? 'border-blue-300 bg-blue-50/20 font-medium' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isUrgent 
                      ? 'bg-rose-100 text-rose-700' 
                      : isImportant 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isUrgent ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">{memo.memoNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isUrgent ? 'bg-rose-100 text-rose-800' :
                        isImportant ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {memo.priority}
                      </span>
                      {!isRead && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                          BARU
                        </span>
                      )}
                      {((memo.attachments && memo.attachments.length > 0) || memo.attachmentUrl) && (
                        <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />
                          {memo.attachments?.length || 1} Lampiran
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm text-slate-900 mt-1 truncate">
                      {memo.title || memo.subject}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {memo.content}
                    </p>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Dari: <strong className="text-slate-700">{memo.senderName}</strong></span>
                      <span>•</span>
                      <span>Kepada: <strong className="text-blue-700">{recipientLabel}</strong></span>
                      <span>•</span>
                      <span>{memo.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Baca Memo</span>
                  </button>

                  {isMasterOrManager && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Hapus memo ini?')) {
                          deleteInternalMemo(memo.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                      title="Hapus memo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: FORM TULIS MEMORANDUM BARU (Manager) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tulis Memorandum Internal</h3>
                  <p className="text-[11px] text-slate-500">Kirim instruksi resmi ke akun terpilih atau divisi kerja</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitMemo} className="space-y-4 mt-4">
              
              {/* Recipient Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Penerima Memo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType('user')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      recipientType === 'user' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Akun Spesifik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('role')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      recipientType === 'role' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Per Divisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('all')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      recipientType === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>📢 Semua Akun</span>
                  </button>
                </div>
              </div>

              {/* Recipient Target Dropdown */}
              {recipientType === 'user' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Pilih Akun Penerima</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()}) — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'role' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Pilih Divisi Penerima</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="head_kitchen">Kitchen & Chef (Dapur)</option>
                    <option value="head_floor">Floor & Bar (Layanan Tamu)</option>
                    <option value="kasir">Kasir & POS</option>
                    <option value="purchasing">Purchasing & Pengadaan Logistik</option>
                    <option value="staff">Staff Operasional Keseluruhan</option>
                    <option value="manager">Semua Manager Outlet</option>
                  </select>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Derajat Urgensi / Prioritas</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Penting', 'Urgent / Segera'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                        priority === p 
                          ? p === 'Urgent / Segera' ? 'bg-rose-600 text-white border-rose-600' :
                            p === 'Penting' ? 'bg-amber-600 text-white border-amber-600' :
                            'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Perihal */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Perihal / Judul Memorandum <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Standar Operasional Baru Pemotongan Daging & Kebersihan Bar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                />
              </div>

              {/* Content / Pesan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Instruksi / Pesan <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan detail memorandum, instruksi pelaksanaan, tenggat waktu, dan arahan manajerial di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              {/* Attachments Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    Lampirkan Berkas / Foto (Attachment)
                  </label>
                  <label className="cursor-pointer text-[11px] font-bold text-blue-600 hover:underline">
                    + Pilih File / Foto
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          {att.fileType === 'image' ? (
                            <img src={att.fileUrl} alt="Preview" className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block truncate">{att.fileName}</span>
                            <span className="text-[10px] text-slate-400">{att.fileSize}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Memorandum</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MEMO DETAIL VIEWER */}
      {readingMemo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200 text-xs space-y-4">
            
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 font-bold">{readingMemo.memoNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    readingMemo.priority === 'Urgent / Segera' ? 'bg-rose-100 text-rose-800' :
                    readingMemo.priority === 'Penting' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {readingMemo.priority}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">{readingMemo.title || readingMemo.subject}</h3>
              </div>
              <button
                onClick={() => setReadingMemo(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Sender & Recipient Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold">Pengirim (Manager):</span>
                <strong className="text-slate-900">{readingMemo.senderName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Penerima Memo:</span>
                <strong className="text-blue-700">{readingMemo.recipientName || 'Semua Divisi'}</strong>
              </div>
              <div className="col-span-2 text-slate-400 pt-1 border-t border-slate-200">
                Waktu Terbit: <strong className="text-slate-700">{readingMemo.createdAt}</strong>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
              {readingMemo.content}
            </div>

            {/* Attachments Section */}
            {((readingMemo.attachments && readingMemo.attachments.length > 0) || readingMemo.attachmentUrl) && (
              <div className="space-y-2">
                <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  Lampiran Berkas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {readingMemo.attachments?.map(att => (
                    <div key={att.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {att.fileType === 'image' ? (
                          <img 
                            src={att.fileUrl} 
                            alt="thumb" 
                            onClick={() => setLightboxUrl(att.fileUrl)}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-blue-600" />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{att.fileName}</span>
                          <span className="text-[10px] text-slate-400">{att.fileSize || 'Berkas Lampiran'}</span>
                        </div>
                      </div>

                      <a
                        href={att.fileUrl}
                        download={att.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200"
                        title="Download Lampiran"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}

                  {readingMemo.attachmentUrl && !readingMemo.attachments?.length && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {readingMemo.attachmentType === 'image' ? (
                          <img 
                            src={readingMemo.attachmentUrl} 
                            alt="thumb" 
                            onClick={() => setLightboxUrl(readingMemo.attachmentUrl!)}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-blue-600" />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{readingMemo.attachmentName || 'Berkas Lampiran Resmi'}</span>
                          <span className="text-[10px] text-slate-400">Lampiran Dokumen</span>
                        </div>
                      </div>

                      <a
                        href={readingMemo.attachmentUrl}
                        download={readingMemo.attachmentName || 'lampiran'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200"
                        title="Download Lampiran"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sudah dibaca & tersimpan di log
              </span>

              <button
                type="button"
                onClick={() => setReadingMemo(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox for Image Attachment */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] bg-white p-3 rounded-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Attachment Preview" 
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
