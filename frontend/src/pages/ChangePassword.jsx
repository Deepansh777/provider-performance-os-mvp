import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { completeNewPassword, getCognitoUser } from '../authUtils';
import './ChangePassword.css';

function ChangePassword({ onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');

  // Get user info on mount
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCognitoUser();
        if (user && user.username) {
          setUserName(user.username);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    // Cognito password policy validation
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const { isSignedIn } = await completeNewPassword(newPassword);
      
      if (isSignedIn) {
        // Password changed successfully, user is now signed in
        onPasswordChanged();
      } else {
        setError('Password change incomplete. Please try again.');
      }
    } catch (err) {
      console.error('Password change error:', err);
      
      // Handle specific Cognito errors
      if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements. Please check the password policy.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Unable to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 8) return { label: 'Too Short', color: '#e53e3e' };
    
    let strength = 0;
    if (newPassword.length >= 10) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    if (strength < 3) return { label: 'Weak', color: '#ed8936' };
    if (strength < 5) return { label: 'Medium', color: '#ecc94b' };
    return { label: 'Strong', color: '#48bb78' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="change-password-container">
      <div className="change-password-content">
        <Paper elevation={4} className="change-password-paper">
          <Box className="change-password-box">
            {/* Header */}
            <Typography variant="h4" component="h1" className="change-password-title">
              Change Your Password
            </Typography>
            <Typography variant="body1" className="change-password-subtitle">
              Welcome, <strong>{userName}</strong>! 
              <br />
              Please set a new password to continue.
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" className="change-password-alert">
                {error}
              </Alert>
            )}

            {/* Password Requirements */}
            <Box className="password-requirements">
              <Typography variant="caption" className="requirements-title">
                Password must contain:
              </Typography>
              <ul className="requirements-list">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </Box>

            {/* Password Change Form */}
            <form onSubmit={handleSubmit} className="change-password-form">
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                variant="outlined"
                className="change-password-input"
              />

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <Box className="password-strength">
                  <Typography variant="caption" style={{ color: passwordStrength.color }}>
                    Password Strength: <strong>{passwordStrength.label}</strong>
                  </Typography>
                  <Box className="password-strength-bar">
                    <Box
                      className="password-strength-fill"
                      style={{
                        width: passwordStrength.label === 'Too Short' ? '25%' :
                               passwordStrength.label === 'Weak' ? '35%' :
                               passwordStrength.label === 'Medium' ? '65%' : '100%',
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </Box>
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                variant="outlined"
                className="change-password-input"
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                className="change-password-button"
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
              </Button>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}

export default ChangePassword;
