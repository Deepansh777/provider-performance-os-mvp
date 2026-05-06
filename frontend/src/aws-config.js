/**
 * AWS Amplify Configuration for Cognito Authentication
 * 
 * IMPORTANT: You need to set the REACT_APP_COGNITO_APP_CLIENT_ID environment variable
 * Get this from your AWS Cognito User Pool -> App Integration -> App clients
 */

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_zk3y8XtoK',
            userPoolClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID || '', // REQUIRED - Get from Cognito console
            loginWith: {
                email: true,
            },
            signUpVerificationMethod: 'code',
            userAttributes: {
                email: {
                    required: true,
                },
            },
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true,
            },
        },
    },
};

export default awsConfig;
