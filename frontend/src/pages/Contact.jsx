import React, { useState } from 'react';
import '../styles/styles.css';
import '../styles/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'Student',
    queryType: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ loading: false, success: 'Thank you! Your message has been sent successfully.', error: null });
        setFormData({ name: '', email: '', userType: 'Student', queryType: 'General Inquiry', message: '' });
      } else {
        setStatus({ loading: false, success: null, error: data.message || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ loading: false, success: 'Thank you! Your message has been submitted.', error: null });
      setFormData({ name: '', email: '', userType: 'Student', queryType: 'General Inquiry', message: '' });
    }
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-left">
        <h1 className="contact-heading">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Get in Touch
        </h1>
        <p className="contact-info-text">
          Have questions about CareerCraft, need help with your resume, or want to partner with us? Fill out the form and our team will get back to you shortly.
        </p>
      </div>

      <div className="contact-right">
        <div className="contact-form-box">
          <h2>Send Us a Message</h2>

          {status.success && <div style={{ color: '#16a34a', marginBottom: '1rem', fontWeight: 600 }}>{status.success}</div>}
          {status.error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontWeight: 600 }}>{status.error}</div>}

          <form className="contact-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              name="name"
              className="contact-input" 
              placeholder="Your Full Name" 
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input 
              type="email" 
              name="email"
              className="contact-input" 
              placeholder="Your Email Address" 
              value={formData.email}
              onChange={handleChange}
              required
            />
            <select 
              name="userType"
              className="contact-input contact-select"
              value={formData.userType}
              onChange={handleChange}
            >
              <option value="Student">I am a Student / Job Seeker</option>
              <option value="Employer">I am an Employer / Recruiter</option>
              <option value="Institute">I represent an Educational Institute</option>
            </select>
            <textarea 
              name="message"
              className="contact-input contact-textarea" 
              placeholder="Write your message here..."
              rows="4"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button type="submit" className="contact-submit-btn" disabled={status.loading}>
              {status.loading ? 'Sending...' : 'Submit Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;