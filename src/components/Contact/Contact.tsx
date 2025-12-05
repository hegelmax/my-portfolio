import React, { useState } from "react";

import './Contact.scss';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    projectType: "",
    message: "",
    newsletter: false,
  });

  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Basic client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus("error");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/contact/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({
          name: "",
          email: "",
          location: "",
          projectType: "",
          message: "",
          newsletter: false,
        });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page page--contact">
      <div className="container container--narrow">
        <header className="contact-header">
          <h1 className="contact-header__title">Contact</h1>
          <p className="contact-header__intro">
            For collection design, editorial projects or personal styling inquiries, 
            please share a few details about your request. I will get back to you personally.
          </p>
        </header>

        <section className="contact-layout">
          {/* Left column - text and direct contacts */}
          <div className="contact-info">
            <h2 className="contact-info__title">Project with Nadia</h2>
            <p className="contact-info__text">
              I project with brands, creative teams and private clients in the US and Europe. 
              Share your idea, timeline and location — we will decide together what format 
              of collaboration makes the most sense.
            </p>

            <div className="contact-info__block">
              <h3 className="contact-info__subtitle">Typical projects</h3>
              <ul className="contact-info__list">
                <li>Womenswear collection design and development</li>
                <li>Editorial & lookbook styling</li>
                <li>Personal wardrobe curation and event styling</li>
              </ul>
            </div>
          </div>

          {/* Right column - form */}
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-form__row">
                <label className="contact-form__label">
                  Full name *
                  <input
                    type="text"
                    name="name"
                    className="contact-form__input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <div className="contact-form__row">
                <label className="contact-form__label">
                  Email *
                  <input
                    type="email"
                    name="email"
                    className="contact-form__input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <div className="contact-form__row">
                <label className="contact-form__label">
                  City / location
                  <input
                    type="text"
                    name="location"
                    className="contact-form__input"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="New York, Washington DC, Paris…"
                  />
                </label>
              </div>

              <div className="contact-form__row">
                <label className="contact-form__label">
                  Project type
                  <select
                    name="projectType"
                    className="contact-form__select"
                    value={formData.projectType}
                    onChange={handleChange}
                  >
                    <option value="">Select…</option>
                    <option value="collection">Collection design</option>
                    <option value="editorial">Editorial / campaign styling</option>
                    <option value="personal">Personal wardrobe / event styling</option>
                    <option value="other">Other collaboration</option>
                  </select>
                </label>
              </div>

              <div className="contact-form__row">
                <label className="contact-form__label">
                  Message *
                  <textarea
                    name="message"
                    className="contact-form__textarea"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="Please share a brief description, dates and any links or references."
                  />
                </label>
              </div>

              <div className="contact-form__row contact-form__row--inline">
                <label className="contact-form__checkbox">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                  />
                  <span>
                    I’d like to receive occasional updates about new projects.
                  </span>
                </label>
              </div>

              <div className="contact-form__row">
                <button
                  type="submit"
                  className="contact-form__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
              </div>

              {status === "success" && (
                <p className="contact-form__status contact-form__status--success">
                  Thank you for your message. I will get back to you as soon as possible.
                </p>
              )}

              {status === "error" && (
                <p className="contact-form__status contact-form__status--error">
                  Something went wrong. Please check the required fields or try again later.
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Contact;
