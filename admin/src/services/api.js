import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        toast.error('Request failed');
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const message = error.response?.data?.message || error.message || 'Something went wrong';

        if (error.response?.status === 401) {
            toast.error('Session expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else if (error.response?.status === 403) {
            toast.error('Access denied');
        } else if (error.response?.status === 404) {
            toast.error('Resource not found');
        } else if (error.response?.status === 500) {
            toast.error('Server error. Please try again later.');
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export const authAPI = {

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        toast.success('Login successful');
        return response;
    },

    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        toast.success('Registration successful');
        return response;
    }
};

export const userAPI = {

    getProfile: async () => {
        try {
            const response = await api.get('/users/profile');
            return response;
        } catch (error) {
            toast.error('Failed to fetch profile');
            throw error;
        }
    },

    changePassword: async (passwords) => {
        const response = await api.put('/users/change-password', passwords);
        toast.success('Password changed successfull');
        return response;
    }
};

export const storeAPI = {

    getAll: async (search = '') => {
        try {
            const response = await api.get('/stores', {
                params: { search }
            });
            return response;
        } catch (error) {
            toast.error('Failed to load stores');
            throw error;
        }
    },


    getById: async (id) => {
        try {
            const response = await api.get(`/stores/${id}`);
            return response;
        } catch (error) {
            toast.error('Failed to load store details');
            throw error;
        }
    }
};

export const ratingAPI = {

    submit: async (data) => {
        const response = await api.post('/ratings', data);
        toast.success('Rating submitted successfull');
        return response;
    },

    getMyRatings: async () => {
        try {
            const response = await api.get('/ratings/my-ratings');
            return response;
        } catch (error) {
            toast.error('Failed to load your ratings');
            throw error;
        }
    }
};

export const adminAPI = {

    getDashboard: async () => {
        try {
            const response = await api.get('/admin/dashboard');
            return response;
        } catch (error) {
            toast.error('Failed to load dashboard stats');
            throw error;
        }
    },


    getUsers: async (params) => {
        try {
            const response = await api.get('/admin/users', { params });
            return response;
        } catch (error) {
            toast.error('Failed to load users');
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            const response = await api.get(`/admin/users/${id}`);
            return response;
        } catch (error) {
            toast.error('Failed to load user details');
            throw error;
        }
    },

    addUser: async (userData) => {
        const response = await api.post('/admin/users', userData);
        toast.success('User added successfull');
        return response;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        toast.success('User deleted');
        return response;
    },

    getStores: async (params) => {
        try {
            const response = await api.get('/admin/stores', { params });
            return response;
        } catch (error) {
            toast.error('Failed to load stores');
            throw error;
        }
    },

    addStore: async (storeData) => {
        const response = await api.post('/admin/stores', storeData);
        toast.success('Store added successfull');
        return response;
    }
};


adminAPI.deleteStore = async (id) => {
    const response = await api.delete(`/admin/stores/${id}`);
    toast.success('Store deleted');
    return response;
};


export const storeOwnerAPI = {

    getDashboard: async () => {
        try {
            const response = await api.get('/store-owner/dashboard');
            return response;
        } catch (error) {
            toast.error('Failed to load dashboard');
            throw error;
        }
    }
};


storeOwnerAPI.deleteStore = async () => {
    const response = await api.delete('/store-owner/store');
    toast.success('Store deleted');
    return response;
};

export default api;