import React, { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import { validateAddress, validateEmail, validateName, validatePassword } from '../utils/validation';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [userFilters, setUserFilters] = useState({ search: '', role: '', sortBy: 'name', sortOrder: 'ASC' });
    const [storeFilters, setStoreFilters] = useState({ search: '', sortBy: 'name', sortOrder: 'ASC' });


    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
    const [userErrors, setUserErrors] = useState({});


    const [showAddStore, setShowAddStore] = useState(false);
    const [newStore, setNewStore] = useState({ name: '', email: '', address: '', ownerEmail: '', ownerPassword: '' });
    const [storeErrors, setStoreErrors] = useState({});

    useEffect(() => {
        if (activeTab === 'dashboard') fetchDashboardStats();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'stores') fetchStores();
    }, [activeTab]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getDashboard();
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getUsers(userFilters);
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getStores(storeFilters);
            setStores(response.data.stores || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const errors = {};
        const nameError = validateName(newUser.name);
        if (nameError) errors.name = nameError;
        const emailError = validateEmail(newUser.email);
        if (emailError) errors.email = emailError;
        const passwordError = validatePassword(newUser.password);
        if (passwordError) errors.password = passwordError;
        const addressError = validateAddress(newUser.address);
        if (addressError) errors.address = addressError;
        if (Object.keys(errors).length > 0) {
            setUserErrors(errors);
            return;
        }

        try {
            await adminAPI.addUser(newUser);
            setShowAddUser(false);
            setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
            setUserErrors({});
            fetchUsers();
        } catch (error) {
            console.error('Add user error:', error);
        }
    };

    const handleAddStore = async (e) => {
        e.preventDefault();
        const errors = {};
        const nameError = validateName(newStore.name);
        if (nameError) errors.name = nameError;
        const emailError = validateEmail(newStore.email);
        if (emailError) errors.email = emailError;
        const ownerEmailError = validateEmail(newStore.ownerEmail);
        if (ownerEmailError) errors.ownerEmail = ownerEmailError;
        const passwordError = validatePassword(newStore.ownerPassword);
        if (passwordError) errors.ownerPassword = passwordError;
        const addressError = validateAddress(newStore.address);
        if (addressError) errors.address = addressError;
        if (Object.keys(errors).length > 0) {
            setStoreErrors(errors);
            return;
        }

        try {
            await adminAPI.addStore(newStore);
            setShowAddStore(false);
            setNewStore({ name: '', email: '', address: '', ownerEmail: '', ownerPassword: '' });
            setStoreErrors({});
            fetchStores();
        } catch (error) {
            console.error('Add store error:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you delete this user? ')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deleted');
            fetchUsers();
        } catch (error) {
            console.error('Delete user error:', error);
            toast.error('Fail to delete user');
        }
    };

    const handleDeleteStore = async (id) => {
        if (!window.confirm('Are you delete this store? ')) return;
        try {
            await adminAPI.deleteStore(id);
            toast.success('Store deleted');
            fetchStores();
        } catch (error) {
            console.error('Delete store error:', error);
            toast.error('Fail to delete store');
        }
    };

    const SidebarButton = ({ onClick, active, icon, label }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} p-3 rounded-lg transition-colors ${active ? 'bg-primary-600 text-white' : 'text-primary-100 hover:bg-primary-700'
                }`}
        >
            {icon}
            {sidebarOpen && <span className="ml-3 font-medium">{label}</span>}
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-100">

            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-linear-to-b from-primary-800 to-primary-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}
            >
                <div className="p-4 flex items-center justify-between border-b bg-primary-600 border-primary-700">
                    {sidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarButton
                        onClick={() => setActiveTab('dashboard')}
                        active={activeTab === 'dashboard'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        }
                        label="Dashboard"
                    />

                    <SidebarButton
                        onClick={() => setActiveTab('users')}
                        active={activeTab === 'users'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197" />
                            </svg>
                        }
                        label="Users"
                    />

                    <SidebarButton
                        onClick={() => setActiveTab('stores')}
                        active={activeTab === 'stores'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                            </svg>
                        }
                        label="Stores"
                    />
                </nav>

                {sidebarOpen && (
                    <div className="p-4 border-t border-primary-700 bg-blue-950">
                        <div className="text-xs text-primary-200">
                            <p>Store Rating App</p>

                        </div>
                    </div>
                )}
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {activeTab === 'dashboard' && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                stats && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
                                                    <p className="text-4xl font-bold">{stats.totalUsers}</p>
                                                </div>
                                                <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-green-100 text-sm font-medium mb-1">Total Stores</p>
                                                    <p className="text-4xl font-bold">{stats.totalStores}</p>
                                                </div>
                                                <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-yellow-100 text-sm font-medium mb-1">Total Ratings</p>
                                                    <p className="text-4xl font-bold">{stats.totalRatings}</p>
                                                </div>
                                                <div className="bg-yellow-400 bg-opacity-30 rounded-full p-4">
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}


                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-gray-900">👥 Manage Users</h2>
                                <button
                                    onClick={() => setShowAddUser(!showAddUser)}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center"
                                >
                                    {showAddUser ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add New User
                                        </>
                                    )}
                                </button>
                            </div>

                            {showAddUser && (
                                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={newUser.name}
                                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                    placeholder="Enter full name"
                                                    required
                                                />
                                                {userErrors.name && <p className="mt-1 text-sm text-red-600">{userErrors.name}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Id</label>
                                                <input
                                                    type="email"
                                                    value={newUser.email}
                                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                    placeholder="user@abd.com"
                                                    required
                                                />
                                                {userErrors.email && <p className="mt-1 text-sm text-red-600">{userErrors.email}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                            <input
                                                type="password"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                placeholder="Password "
                                                required
                                            />
                                            {userErrors.password && <p className="mt-1 text-sm text-red-600">{userErrors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                            <textarea
                                                value={newUser.address}
                                                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                                placeholder="Enter address "
                                            />
                                            {userErrors.address && <p className="mt-1 text-sm text-red-600">{userErrors.address}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                                            <select
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                            >
                                                <option value="user">Normal User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>

                                        <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200">
                                            Add User
                                        </button>
                                    </form>
                                </div>
                            )}


                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4"> Filter</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                        <input type="text" placeholder="Name, Email, Address..." value={userFilters.search} onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                        <select value={userFilters.role} onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            <option value="">All Roles</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="store_owner">Store Owner</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                        <select value={userFilters.sortBy} onChange={(e) => setUserFilters({ ...userFilters, sortBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            <option value="name">Name</option>
                                            <option value="email">Email</option>
                                            <option value="role">Role</option>

                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                                        <select value={userFilters.sortOrder} onChange={(e) => setUserFilters({ ...userFilters, sortOrder: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            <option value="ASC">Ascending</option>
                                            <option value="DESC">Descending</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={fetchUsers} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200">Apply Filters</button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found</td>
                                                    </tr>
                                                ) : (
                                                    users.map((user) => (
                                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">{user.address || 'N/A'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'store_owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                                    {user.role.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                <button onClick={() => handleDeleteUser(user.id)} className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stores' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-gray-900">🏪 Manage Stores</h2>
                                <button onClick={() => setShowAddStore(!showAddStore)} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center">
                                    {showAddStore ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add New Store
                                        </>
                                    )}
                                </button>
                            </div>

                            {showAddStore && (
                                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4"> Add New Store</h3>
                                    <form onSubmit={handleAddStore} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                                                <input type="text" value={newStore.name} onChange={(e) => setNewStore({ ...newStore, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Enter store name" required />
                                                {storeErrors.name && <p className="mt-1 text-sm text-red-600">{storeErrors.name}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                                                <input type="email" value={newStore.email} onChange={(e) => setNewStore({ ...newStore, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="store@abd.com" required />
                                                {storeErrors.email && <p className="mt-1 text-sm text-red-600">{storeErrors.email}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                                            <textarea value={newStore.address} onChange={(e) => setNewStore({ ...newStore, address: e.target.value })} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Enter store address " />
                                            {storeErrors.address && <p className="mt-1 text-sm text-red-600">{storeErrors.address}</p>}
                                        </div>

                                        <hr className="my-6" />
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4"> Store Owner Details</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                                                <input type="email" value={newStore.ownerEmail} onChange={(e) => setNewStore({ ...newStore, ownerEmail: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="owner@abd.com" required />
                                                {storeErrors.ownerEmail && <p className="mt-1 text-sm text-red-600">{storeErrors.ownerEmail}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Password</label>
                                                <input type="password" value={newStore.ownerPassword} onChange={(e) => setNewStore({ ...newStore, ownerPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Password" required />
                                                {storeErrors.ownerPassword && <p className="mt-1 text-sm text-red-600">{storeErrors.ownerPassword}</p>}
                                            </div>
                                        </div>

                                        <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200">Add Store</button>
                                    </form>
                                </div>
                            )}

                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Filter </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                        <input type="text" placeholder="Name, Email, Address..." value={storeFilters.search} onChange={(e) => setStoreFilters({ ...storeFilters, search: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                        <select value={storeFilters.sortBy} onChange={(e) => setStoreFilters({ ...storeFilters, sortBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            <option value="name">Name</option>
                                            <option value="email">Email</option>
                                            <option value="average_rating">Rating</option>

                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                                        <select value={storeFilters.sortOrder} onChange={(e) => setStoreFilters({ ...storeFilters, sortOrder: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                            <option value="ASC">Ascending</option>
                                            <option value="DESC">Descending</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={fetchStores} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200">Apply Filters</button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto divide-y divide-gray-200">
                                            <thead>
                                                <tr>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ratings</th>
                                                    <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {stores.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No stores found</td>
                                                    </tr>
                                                ) : (
                                                    stores.map((store, idx) => (
                                                        <tr key={store.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{store.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{store.email}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{store.address || 'N/A'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="inline-flex items-center space-x-2">
                                                                    <span className="text-yellow-500 font-semibold">★</span>
                                                                    <span className="text-sm font-bold text-gray-800">{typeof store.average_rating === 'number' ? store.average_rating.toFixed(1) : '—'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{store.total_ratings ?? 0}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                                <button onClick={() => handleDeleteStore(store.id)} className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors">Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;