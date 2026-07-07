const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminDashboard.tsx', 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { User, Report } from '../../api/types';
import { Users, Shield, MessageSquare, AlertTriangle, Database, Menu } from 'lucide-react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, getDoc } from '../../api/config/firebase';
import { adminFunctions } from '../../api/functions/adminFunctions';
import { ownerFunctions } from '../../api/functions/ownerFunctions';`;

code = code.replace(/import React, { useState } from 'react';\s*import { User } from '\.\.\/\.\.\/api\/types';\s*import { Users, Shield, MessageSquare, AlertTriangle, Database, Menu } from 'lucide-react';/, imports);

const stateHook = `
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

  const handleBan = async (uid: string) => { await adminFunctions.banUser(uid, user.id); };
  const handleUnban = async (uid: string) => { await adminFunctions.unbanUser(uid, user.id); };
  const handleResolve = async (rid: string) => { await adminFunctions.handleReport(rid, user.id, 'resolve'); };
  
  const [roleEmail, setRoleEmail] = useState('');
  const [roleSelect, setRoleSelect] = useState('admin');
  const handleUpdateRole = async () => {
    // Basic implementation for owner
    if (!roleEmail.trim()) return;
    const q = query(collection(db, 'users'), where('email', '==', roleEmail.trim()));
    onSnapshot(q, async (snap) => {
      if(!snap.empty) {
        const target = snap.docs[0];
        if (roleSelect === 'senior' || roleSelect === 'helper' || roleSelect === 'admin') {
           await ownerFunctions.manageAdminMembership(target.id, 'invite', user.id); // Or adjust logic
           await updateDoc(doc(db, 'users', target.id), { role: roleSelect });
        } else {
           await updateDoc(doc(db, 'users', target.id), { role: 'user' });
        }
        setRoleEmail('');
      }
    }, (err) => console.log(err));
  };
`;

code = code.replace(/export function AdminDashboard.*?\n.*?const tabs = \[/s, `export function AdminDashboard({ user, onMenuClick }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
${stateHook}
  const tabs = [`);

code = code.replace(/<p className="text-3xl font-bold text-gray-900">1,248<\/p>/g, '<p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>');
code = code.replace(/<p className="text-3xl font-bold text-gray-900">432<\/p>/g, '<p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>');
code = code.replace(/<p className="text-3xl font-bold text-gray-900">12<\/p>/g, '<p className="text-3xl font-bold text-gray-900">{stats.reportsPending}</p>');
code = code.replace(/<p className="text-3xl font-bold text-gray-900">8,592<\/p>/g, '<p className="text-3xl font-bold text-gray-900">{stats.messagesToday}</p>');

const usersTableBody = `<tbody className="divide-y divide-gray-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={u.profilePicture || \`https://ui-avatars.com/api/?name=\${u.username}\`} className="w-8 h-8 rounded-full" alt="user" />
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
                </tbody>`;

code = code.replace(/<tbody className="divide-y divide-gray-100">.*?<\/tbody>/s, usersTableBody);

const reportsTableBody = `<tbody className="divide-y divide-gray-100">
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
                </tbody>`;

code = code.replace(/<tbody className="divide-y divide-gray-100">.*?<\/tbody>/s, reportsTableBody);

code = code.replace(/<input type="text" placeholder="User ID or Email" className="flex-1 px-3 py-2 border rounded-lg" \/>/, '<input type="text" placeholder="User ID or Email" className="flex-1 px-3 py-2 border rounded-lg" value={roleEmail} onChange={e => setRoleEmail(e.target.value)} />');
code = code.replace(/<select className="px-3 py-2 border rounded-lg bg-white">/, '<select className="px-3 py-2 border rounded-lg bg-white" value={roleSelect} onChange={e => setRoleSelect(e.target.value)}>');
code = code.replace(/<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Update Role<\/button>/, '<button onClick={handleUpdateRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Update Role</button>');
code = code.replace(/<button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">\s*Reset Database \(Owner Only\)\s*<\/button>/, '<button onClick={() => ownerFunctions.resetDatabase(user.id, true)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">Reset Database (Owner Only)</button>');

fs.writeFileSync('src/components/admin/AdminDashboard.tsx', code);
