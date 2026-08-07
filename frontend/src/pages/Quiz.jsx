import React from 'react';

const Quiz = () => {
  const serviceUrl = import.meta.env.VITE_QUIZ_SERVICE_URL || 'https://quiz-d8f3.onrender.com';

  return (
    <div id="quiz" style={{ width: '100%', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', scrollMarginTop: '90px' }}>
      <iframe
        src={serviceUrl}
        title="QuizCraft AI"
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

export default Quiz;
