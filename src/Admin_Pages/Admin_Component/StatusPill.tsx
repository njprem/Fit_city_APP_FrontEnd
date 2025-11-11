import React from 'react';

const StatusPill = ({ status }) => {
    const isActivity = status === 'Active';
    const bgColor = isActivity ? 'bg-green-200' : 'bg-red-200';
    const textColor = isActivity ? 'text-green-700' : 'text-red-700';

    return (
        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {status}
        </span>
    );
};
export default StatusPill;