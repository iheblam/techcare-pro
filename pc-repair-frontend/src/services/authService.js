import { authAPI } from './apiService';

const authService = {
  requestPasswordReset: async (email) => {
    const response = await authAPI.requestPasswordReset(email);
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await authAPI.verifyResetToken(token);
    return response.data;
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await authAPI.resetPassword(token, newPassword, confirmPassword);
    return response.data;
  },
};

export default authService;
