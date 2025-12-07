import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';
import { storeOwnerAPI, userAPI } from '../services/api';


function StoreOwnerDashboard({ user }) {
    const [storeData, setStoreData] = useState(null);
    const [ratingUsers, setRatingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        fetchDashboard();
    }, [user]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Session expired. Please login.');

                navigate('/login');
                return;
            }
            const response = await storeOwnerAPI.getDashboard();
            setStoreData(response.data.store);
            setRatingUsers(response.data.ratingUsers);
        } catch (error) {
            console.error('Error fetching dashboard:', error.response || error);

            if (error.response && error.response.status === 401) {

                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (error.response && error.response.status === 403) {
                toast.error('Access denied');
            } else {
                toast.error('Failed to load dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            await userAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordChange(false);
        } catch (error) {
            console.error('Password change error:', error);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={`text-xl ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
                ★
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard..</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!storeData) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">No store data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900"> Store Owner </h2>

                <div className="ml-4">
                    <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
                    >
                        {showPasswordChange ? 'Password Change' : 'Change Password'}
                    </button>
                </div>
            </div>

            <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">🏪 {storeData.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{storeData.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Address</p>
                        <p className="text-gray-900 font-medium">{storeData.address}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-600 mb-2">Average Rating</p>
                    <div className="flex items-center">
                        <div className="flex">
                            {renderStars(Math.round(storeData.average_rating))}
                        </div>
                        <span className="ml-3 text-2xl font-bold text-gray-900">
                            {storeData.average_rating.toFixed(2)} / 5.0
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Total Ratings: <span className="font-semibold">{storeData.total_ratings}</span>
                    </p>
                </div>
            </div>

            {showPasswordChange && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <form onSubmit={handlePasswordChange} className="mt-0 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Users Rated Store</h3>

                {ratingUsers.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No ratings yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>

                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ratingUsers.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex">
                                                    {renderStars(item.rating)}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600">({item.rating}/5)</span>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StoreOwnerDashboard;