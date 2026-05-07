import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Alert, CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { cognitoSignIn } from '../authUtils';
import './Login.css';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { isSignedIn, nextStep } = await cognitoSignIn(email, password);

            // Check if password change is required (NEW_PASSWORD_REQUIRED challenge)
            if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                // User needs to change password (first-time login)
                onLoginSuccess(null, true, null);
            } else if (isSignedIn) {
                // Successfully signed in
                onLoginSuccess(null, false, null);
            } else {
                // Other challenge types
                setError('Additional authentication steps required. Please contact support.');
            }
        } catch (err) {
            console.error('Login error:', err);

            // Handle specific Cognito errors
            if (err.name === 'NotAuthorizedException') {
                setError('Invalid email or password.');
            } else if (err.name === 'UserNotFoundException') {
                setError('Invalid email or password.');
            } else if (err.name === 'UserNotConfirmedException') {
                setError('User account is not confirmed. Please contact administrator.');
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Unable to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <Paper elevation={4} className="login-paper">
                    <Box className="login-box">
                        {/* Logo/Title */}
                        <Typography variant="h4" component="h1" className="login-title">
                            Provider Performance OS
                        </Typography>
                        <Typography variant="subtitle1" className="login-subtitle">
                            Sign In
                        </Typography>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" className="login-alert">
                                {error}
                            </Alert>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="login-form">
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                                variant="outlined"
                                className="login-input"
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                variant="outlined"
                                className="login-input"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={showPassword}
                                        onChange={(e) => setShowPassword(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Show password"
                                className="show-password-checkbox"
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                className="login-button"
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                            </Button>
                        </form>

                        {/* Contact Message */}
                        <Box className="login-footer">
                            <Typography variant="body2" className="login-footer-text" style={{ marginBottom: '8px' }}>
                                Need help?{' '}
                                <a href="mailto:dpnsharr@gmail.com" className="login-footer-link">
                                    Contact Support
                                </a>
                            </Typography>
                            <Typography variant="body2" className="login-footer-text" style={{ fontSize: '12px', color: '#718096' }}>
                                © 2026 Provider Performance OS. All rights reserved.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </div>
        </div>
    );
}

export default Login;
