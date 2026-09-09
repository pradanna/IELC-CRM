import React from 'react';
import ShowGeneral from './ShowGeneral';
import ShowKids from './ShowKids';
import ShowIelts from './ShowIelts';

export default function Show(props) {
    const category = props.exam?.data?.category || 'General';

    if (category === 'Kids') {
        return <ShowKids {...props} />;
    }
    if (category === 'IELTS') {
        return <ShowIelts {...props} />;
    }
    return <ShowGeneral {...props} />;
}
