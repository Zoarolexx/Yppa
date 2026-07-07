import React, { useState, useEffect } from 'react';
import { User, Report } from '../../api/types';
import { Users, Shield, MessageSquare, AlertTriangle, Database, Menu } from 'lucide-react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, getDoc, getDocs } from '../../api/config/firebase';
import { adminFunctions } from '../../api/functions/adminFunctions';
import { ownerFunctions } from '../../api/functions/ownerFunctions';

interface AdminDashboardProps {
  user: User;
  onMenuClick?: () => void;
}

export function AdminDashboard({ user, onMenuClick }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0, reportsPending: 0, messagesToday: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let active = 0;
      let banned = 0;
      const uList: User[] = [];
      snapshot.forEach(d => {
        const data = { id: d.id, ...d.data() } as User;
        if (data.isOnline) active++;
        if (data.isBanned) banned++;
        uList.push(data);
      });
      setStats(prev => ({ ...prev, totalUsers: snapshot.size, activeUsers: active, bannedUsers: banned }));
      setUsersList(uList);
    });

    const unsubReports = onSnapshot(query(collection(db, 'reports'), where('status', '==', 'pending')), (snapshot) => {
      const rList: Report[] = [];
      snapshot.forEach(d => {
        rList.push({ id: d.id, ...d.data() } as Report);
      });
      setStats(prev => ({ ...prev, reportsPending: snapshot.size }));
      setReportsList(rList);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unsubMessages = onSnapshot(query(collection(db, 'messages'), where('createdAt', '>=', today)), (snapshot) => {
      setStats(prev => ({ ...prev, messagesToday: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubReports();
      unsubMessages();
    };
  }, []);

  const handleBan = async (uid: string) => { const res = await adminFunctions.banUser(uid, user.id); alert(res.message); };
  const handleUnban = async (uid: string) => { const res = await adminFunctions.unbanUser(uid, user.id); alert(res.message); };
  const handleResolve = async (rid: string) => { const res = await adminFunctions.handleReport(rid, user.id, 'resolve'); alert(res.message); };
  
  const [roleEmail, setRoleEmail] = useState('');
  const [roleSelect, setRoleSelect] = useState('admin');
  const handleUpdateRole = async () => {
    if (!roleEmail.trim()) return;
    const q = query(collection(db, 'users'), where('email', '==', roleEmail.trim()));
    getDocs(q).then(async (snap) => {
      if(!snap.empty) {
        const target = snap.docs[0];
        if (roleSelect === 'senior' || roleSelect === 'helper' || roleSelect === 'admin') {
           await ownerFunctions.manageAdminMembership(target.id, 'invite', user.id);
           await updateDoc(doc(db, 'users', target.id), { role: roleSelect });
        } else {
           await updateDoc(doc(db, 'users', target.id), { role: 'user' });
        }
        setRoleEmail('');
      }
    }).catch(err => console.log(err));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Database size={18} /> },
    { id: 'users', label: 'Users Management', icon: <Users size={18} /> },
    { id: 'reports', label: 'Reports', icon: <AlertTriangle size={18} /> },
  ];

  if (user.role === 'owner') {
    tabs.push({ id: 'roles', label: 'Role Management', icon: <Shield size={18} /> });
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 flex items-center gap-4">
        {onMenuClick && (
          <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full" onClick={onMenuClick}>
            <Menu size={24} />
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Logged in as {user.username} ({user.role})</p>
        </div>
      </div>

      <div className="flex px-4 md:px-8 py-4 bg-white border-b border-gray-200 overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Total Users</h3>
                <Users className="text-blue-500" size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Active Users</h3>
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Pending Reports</h3>
                <AlertTriangle className="text-yellow-500" size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.reportsPending}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Messages Sent Today</h3>
                <MessageSquare className="text-purple-500" size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.messagesToday}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">User Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.username}`} className="w-8 h-8 rounded-full" alt="user" />
                        <div>
                          <p className="font-medium text-gray-900">{u.username}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">{u.role}</span></td>
                      <td className="px-6 py-4">
                        {u.isBanned 
                          ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">Banned</span>
                          : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">{u.isOnline ? 'Active' : 'Offline'}</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {u.isBanned ? (
                          <button onClick={() => handleUnban(u.id)} className="text-green-600 hover:text-green-800 font-medium mr-3">Unban</button>
                        ) : (
                          <button onClick={() => handleBan(u.id)} className="text-red-600 hover:text-red-800 font-medium mr-3">Ban</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Reports Handling</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Reported User</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportsList.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{r.reportedId}</td>
                      <td className="px-6 py-4">{r.reason}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md font-medium">Pending</span></td>
                      <td className="px-6 py-4">
                        <button className="text-green-600 hover:text-green-800 font-medium" onClick={() => handleResolve(r.id)}>Resolve</button>
                      </td>
                    </tr>
                  ))}
                  {reportsList.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No pending reports</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && user.role === 'owner' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Role Management</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium mb-3">Promote/Demote Users</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="User ID or Email" className="flex-1 px-3 py-2 border rounded-lg" value={roleEmail} onChange={e => setRoleEmail(e.target.value)} />
                  <select className="px-3 py-2 border rounded-lg bg-white" value={roleSelect} onChange={e => setRoleSelect(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="senior">Senior</option>
                    <option value="helper">Helper</option>
                    <option value="user">User</option>
                  </select>
                  <button onClick={handleUpdateRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Update Role</button>
                </div>
              </div>
              <div className="pt-6 border-t border-red-100">
                <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                <button onClick={() => ownerFunctions.resetDatabase(user.id, true)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">Reset Database (Owner Only)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
