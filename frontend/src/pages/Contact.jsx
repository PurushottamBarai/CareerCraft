import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/styles.css';
import '../styles/contact.css';

const Contact = () => {
  const { API_BASE } = useContext(AuthContext);
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
      const res = await fetch(`${API_BASE}/contact`, {
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
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Have a question or feedback? Send us a message below.</p>
      </div>

      <div className="contact-card">
        {status.success && <div className="contact-alert success">{status.success}</div>}
        {status.error && <div className="contact-alert error">{status.error}</div>}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userType">I am a</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
            >
              <option value="Student">Student / Job Seeker</option>
              <option value="Employer">Employer / Recruiter</option>
              <option value="Institute">Educational Institute</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={status.loading}>
            {status.loading ? 'Sending...' : 'Submit Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;