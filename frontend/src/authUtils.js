/**
 * Authentication utility functions for AWS Cognito
 */
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import awsConfig from './aws-config';

// Configure Amplify
Amplify.configure(awsConfig);

const API_BASE_URL = '';

/**
 * Sign in with Cognito
 */
export const cognitoSignIn = async (email, password) => {
    try {
        const { isSignedIn, nextStep } = await signIn({
            username: email,
            password: password,
        });

        return { isSignedIn, nextStep };
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

/**
 * Complete new password challenge (first-time login)
 */
export const completeNewPassword = async (newPassword) => {
    const { confirmSignIn } = await import('aws-amplify/auth');
    try {
        const { isSignedIn, nextStep } = await confirmSignIn({
            challengeResponse: newPassword,
        });
        return { isSignedIn, nextStep };
    } catch (error) {
        console.error('Complete new password error:', error);
        throw error;
    }
};

/**
 * Get current authenticated user from Cognito
 */
export const getCognitoUser = async () => {
    try {
        const user = await getCurrentUser();
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};

/**
 * Get authentication tokens from current session
 */
export const getAuthTokens = async () => {
    try {
        const session = await fetchAuthSession();
        return {
            idToken: session.tokens?.idToken?.toString(),
            accessToken: session.tokens?.accessToken?.toString(),
        };
    } catch (error) {
        console.error('Get tokens error:', error);
        return null;
    }
};

/**
 * Get the ID token for API calls
 */
export const getAuthToken = async () => {
    const tokens = await getAuthTokens();
    return tokens?.idToken || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
    try {
        await getCurrentUser();
        return true;
    } catch {
        return false;
    }
};

/**
 * Verify the current token with the backend and get user data
 */
export const verifyToken = async () => {
    try {
        const token = await getAuthToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user));
                return data.user;
            }
        }

        // Token is invalid, logout
        await logout();
        return null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
};

/**
 * Get stored user data from localStorage
 */
export const getStoredUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
    }
};

/**
 * Logout user from Cognito and clear local storage
 */
export const logout = async () => {
    try {
        await signOut();
        localStorage.removeItem('user');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout anyway
        localStorage.removeItem('user');
        window.location.href = '/';
    }
};

/**
 * Make an authenticated API request with Cognito token
 */
export const authenticatedFetch = async (url, options = {}) => {
    const token = await getAuthToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // If unauthorized, logout and redirect
    if (response.status === 401 || response.status === 403) {
        await logout();
        throw new Error('Authentication failed');
    }

    return response;
};

/**
 * Change password for authenticated user
 */
export const changePassword = async (oldPassword, newPassword) => {
    const { updatePassword } = await import('aws-amplify/auth');
    try {
        await updatePassword({
            oldPassword: oldPassword,
            newPassword: newPassword,
        });
        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
};

const authUtils = {
    cognitoSignIn,
    completeNewPassword,
    getCognitoUser,
    getAuthToken,
    getAuthTokens,
    getStoredUser,
    isAuthenticated,
    verifyToken,
    logout,
    authenticatedFetch,
    changePassword,
};

export default authUtils;

