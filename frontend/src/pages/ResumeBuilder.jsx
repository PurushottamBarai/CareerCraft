import React from 'react';

const ResumeBuilder = () => {
  const serviceUrl = import.meta.env.VITE_RESUME_SERVICE_URL || 'https://resumecraft-9zk4.onrender.com';
  
  return (
    <div id="resume" style={{ width: '100%', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', scrollMarginTop: '90px' }}>
      <iframe
        src={serviceUrl}
        title="ResumeCraft"
        style={{
          width: '100%',
          height: '100vh',
          minHeight: '850px',
          border: 'none',
          display: 'block'
        }}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default ResumeBuilder;
