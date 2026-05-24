"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserProfile = syncUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.selectUserRole = selectUserRole;
exports.logoutUser = logoutUser;
const client_1 = require("./client");
async function syncUserProfile(data) {
    const res = await client_1.apiClient.post('/api/v1/auth/sync', data);
    return res.data;
}
async function updateUserProfile(data) {
    const res = await client_1.apiClient.put('/api/v1/auth/profile', data);
    return res.data;
}
async function selectUserRole(role) {
    const res = await client_1.apiClient.put('/api/v1/auth/role', { role });
    return res.data;
}
async function logoutUser() {
    const res = await client_1.apiClient.post('/api/v1/auth/logout');
    return res.data;
}
