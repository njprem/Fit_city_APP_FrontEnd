import React from 'react';

export type StatusType = 'Active' | 'Inactive' | 'Add' | 'Edit' | 'Delete' | 'Reject';

export interface StatusPillProps {
    status: StatusType;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
    const baseClasses = 'inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium';

    const classesMap: Record<StatusType, string> = {
        Active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
        Add: 'bg-blue-100 text-blue-800',
        Edit: 'bg-yellow-100 text-yellow-800',
        Delete: 'bg-gray-200 text-gray-800',
        Reject: 'bg-rose-100 text-rose-800',
    };

    const classes = classesMap[status] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`${baseClasses} ${classes}`}>
            {status}
        </span>
    );
};

export default StatusPill;
