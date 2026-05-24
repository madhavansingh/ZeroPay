import { ApiResponse } from '@zeropay/shared-types';
export declare function syncUserProfile(data: {
    displayName?: string;
    phone?: string;
    fcmToken?: string;
}): Promise<ApiResponse>;
export declare function updateUserProfile(data: {
    displayName?: string;
    fcmToken?: string;
    notificationPreferences?: {
        paymentReceived?: boolean;
        paymentConfirmed?: boolean;
        invoiceExpired?: boolean;
        escrowUpdates?: boolean;
        disputeAlerts?: boolean;
        milestoneNotifications?: boolean;
        channels?: ('push' | 'email')[];
    };
}): Promise<ApiResponse>;
export declare function selectUserRole(role: 'customer' | 'merchant' | 'both'): Promise<ApiResponse>;
export declare function logoutUser(): Promise<ApiResponse>;
