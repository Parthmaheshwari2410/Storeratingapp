import React, { useState } from 'react';
import RatingForm from './RatingForm';

function StoreCard({ store, userRating, onRatingSubmit }) {
    const [showRatingForm, setShowRatingForm] = useState(false);

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

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-200">
            <h3 className="text-xl font-bold text-primary-700 mb-3">{store.name}</h3>

            <div className="space-y-2 mb-4">
                <div className="flex items-start">
                    <span className="text-sm font-semibold text-gray-600 w-24">Email:</span>
                    <span className="text-sm text-gray-800">{store.email}</span>
                </div>

                <div className="flex items-start">
                    <span className="text-sm font-semibold text-gray-600 w-24">Address:</span>
                    <span className="text-sm text-gray-800">{store.address}</span>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Overall Rating:</p>
                <div className="flex items-center">
                    <div className="flex">
                        {renderStars(Math.round(store.average_rating))}
                    </div>
                    <span className="ml-3 text-lg font-bold text-gray-700">
                        {store.average_rating.toFixed(1)} / 5.0
                    </span>
                </div>
            </div>

            {userRating !== undefined && (
                <div className="bg-primary-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-primary-700 mb-2">Your Rating:</p>
                    {userRating ? (
                        <div className="flex items-center">
                            <div className="flex">
                                {renderStars(userRating)}
                            </div>
                            <span className="ml-3 text-lg font-bold text-primary-700">
                                {userRating} / 5
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-600">Not rated</span>
                    )}
                </div>
            )}

            <button
                onClick={() => setShowRatingForm(!showRatingForm)}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
            >
                {userRating ? 'Update Rating' : 'Submit Rating'}
            </button>

            {showRatingForm && (
                <RatingForm
                    storeId={store.id}
                    currentRating={userRating}
                    onSubmit={(success) => {
                        if (success) {
                            setShowRatingForm(false);
                            onRatingSubmit();
                        }
                    }}
                    onCancel={() => setShowRatingForm(false)}
                />
            )}
        </div>
    );
}

export default StoreCard;