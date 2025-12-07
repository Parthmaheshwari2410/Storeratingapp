import React, { useState } from 'react';
import { ratingAPI } from '../services/api';



function RatingForm({ storeId, currentRating, onSubmit, onCancel }) {
    const [rating, setRating] = useState(currentRating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating < 1 || rating > 5) {
            return;
        }

        setLoading(true);

        try {
            await ratingAPI.submit({ storeId, rating });
            onSubmit(true);
        } catch (err) {
            console.error('Rating submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            return (
                <span
                    key={index}
                    className={`text-4xl cursor-pointer transition-colors ${starValue <= (hoveredRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                >
                    ★
                </span>
            );
        });
    };

    return (
        <div className="mt-4 p-6 from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
                {currentRating ? ' Update Your Rating' : 'Submit Your Rating'}
            </h4>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <div className="flex justify-center space-x-2 mb-3">
                        {renderStars()}
                    </div>
                    <div className="text-center">
                        <span className="text-lg font-semibold text-gray-700">
                            Selected: {rating} / 5
                        </span>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading || rating === 0}
                        className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting..
                            </span>
                        ) : 'Submit Rating'}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RatingForm;