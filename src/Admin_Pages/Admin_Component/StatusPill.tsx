import React from 'react';

export interface StatusPillProps {
    status: 'Active' | 'Inactive';
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
    const baseClasses = 'inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium';
    const classes = status === 'Active'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';

    return (
        <span className={`${baseClasses} ${classes}`}>
            {status}
        </span>
    );
};

export default StatusPill;
