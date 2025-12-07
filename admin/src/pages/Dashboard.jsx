import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { storeAPI, userAPI } from '../services/api';

function Dashboard({ user }) {
    const [stores, setStores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [editingStoreId, setEditingStoreId] = useState(null);
    const [tempRatings, setTempRatings] = useState({});
    const [hoveredRatings, setHoveredRatings] = useState({});
    const [submittingRatings, setSubmittingRatings] = useState({});

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await storeAPI.getAll(searchTerm);
            setStores(response.data.stores);
        } catch (error) {
            console.error('Error fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStores();
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password at least 8 characters');
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

    const startEditingRating = (storeId, currentRating) => {
        setEditingStoreId(storeId);
        setTempRatings({ ...tempRatings, [storeId]: currentRating || 0 });
    };

    const cancelEditingRating = (storeId) => {
        setEditingStoreId(null);
        const newTempRatings = { ...tempRatings };
        delete newTempRatings[storeId];
        setTempRatings(newTempRatings);
        const newHoveredRatings = { ...hoveredRatings };
        delete newHoveredRatings[storeId];
        setHoveredRatings(newHoveredRatings);
    };

    const handleStarClick = (storeId, rating) => {
        setTempRatings({ ...tempRatings, [storeId]: rating });
    };

    const handleStarHover = (storeId, rating) => {
        setHoveredRatings({ ...hoveredRatings, [storeId]: rating });
    };

    const handleStarLeave = (storeId) => {
        const newHoveredRatings = { ...hoveredRatings };
        delete newHoveredRatings[storeId];
        setHoveredRatings(newHoveredRatings);
    };

    const submitRating = async (storeId) => {
        const rating = tempRatings[storeId];

        if (!rating || rating < 1 || rating > 5) {
            toast.error('Please select a rating between 1 and 5');
            return;
        }

        setSubmittingRatings({ ...submittingRatings, [storeId]: true });

        try {
            const response = await fetch('http://localhost:5000/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ storeId, rating })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Rating submitted successfully');
                setEditingStoreId(null);
                const newTempRatings = { ...tempRatings };
                delete newTempRatings[storeId];
                setTempRatings(newTempRatings);
                fetchStores();
            } else {
                toast.error(data.message || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Rating submit error:', error);
            toast.error('Failed to submit rating');
        } finally {
            const newSubmittingRatings = { ...submittingRatings };
            delete newSubmittingRatings[storeId];
            setSubmittingRatings(newSubmittingRatings);
        }
    };

    const renderStars = (rating, interactive = false, storeId = null) => {
        const displayRating = interactive
            ? (hoveredRatings[storeId] || tempRatings[storeId] || rating)
            : rating;

        return Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            return (
                <span
                    key={index}
                    className={`${interactive ? 'text-2xl cursor-pointer' : 'text-xl'} transition-colors ${starValue <= displayRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                    onClick={interactive ? () => handleStarClick(storeId, starValue) : undefined}
                    onMouseEnter={interactive ? () => handleStarHover(storeId, starValue) : undefined}
                    onMouseLeave={interactive ? () => handleStarLeave(storeId) : undefined}
                >
                    ★
                </span>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h2>
                        <p className="text-gray-600 mt-2">Rate stores</p>
                    </div>

                    <div className="ml-4">
                        <button
                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
                        >
                            {showPasswordChange ? 'Hide Password Change' : 'Change Password'}
                        </button>
                    </div>
                </div>

                {showPasswordChange && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Stores
                    </h3>
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Search by name or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                fetchStores();
                            }}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    </form>
                </div>


                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4  from-primary-600 to-primary-700">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            All Stores ({stores.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading stores...</p>
                            </div>
                        </div>
                    ) : stores.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-600 text-lg">No stores found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Store Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Overall Rating
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Your Rating
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stores.map((store) => (
                                        <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="bg-primary-100 rounded-full p-2 mr-3">
                                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{store.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {store.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                                <div className="line-clamp-2">{store.address || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex mr-2">
                                                        {renderStars(Math.round(store.average_rating))}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {store.average_rating.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ({store.total_ratings} {store.total_ratings === 1 ? 'rating' : 'ratings'})
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingStoreId === store.id ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center">
                                                            <div className="flex">
                                                                {renderStars(store.user_rating, true, store.id)}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-700 font-medium">
                                                            {tempRatings[store.id] > 0
                                                                ? `Selected: ${tempRatings[store.id]} / 5`
                                                                : 'Click stars to rate'}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => submitRating(store.id)}
                                                                disabled={submittingRatings[store.id] || !tempRatings[store.id]}
                                                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                                                            >
                                                                {submittingRatings[store.id] ? (
                                                                    <>
                                                                        <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Saving.
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Save
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => cancelEditingRating(store.id)}
                                                                disabled={submittingRatings[store.id]}
                                                                className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {store.user_rating ? (
                                                            <div>
                                                                <div className="flex items-center mb-2">
                                                                    <div className="flex mr-2">
                                                                        {renderStars(store.user_rating)}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-primary-700">
                                                                        {store.user_rating} / 5
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => startEditingRating(store.id, store.user_rating)}
                                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
                                                                >
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Update Rating
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className="text-sm text-gray-500 italic mb-2">Not rate</p>
                                                                <button
                                                                    onClick={() => startEditingRating(store.id, 0)}
                                                                    className="bg-primary-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center"
                                                                >
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                    </svg>
                                                                    Rate Store
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;