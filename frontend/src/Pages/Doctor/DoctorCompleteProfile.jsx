import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/DoctorCompleteProfile.css";

const API = "http://localhost:8080";

const SPECIALIZATIONS = [
  "General Physician", "Cardiology", "Dermatology", "Endocrinology",
  "Gastroenterology", "Neurology", "Oncology", "Ophthalmology",
  "Orthopedics", "Pediatrics", "Psychiatry", "Pulmonology",
  "Radiology", "Urology", "ENT", "Gynecology", "Nephrology", "Other"
];

const COUNCILS = [
  "Medical Council of India (MCI)",
  "National Medical Commission (NMC)",
  "Delhi Medical Council",
  "Maharashtra Medical Council",
  "Tamil Nadu Medical Council",
  "Karnataka Medical Council",
  "Other State Medical Council"
];

function DoctorCompleteProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    specialization: "",
    qualification: "",
    experienceYears: "",
    registrationNumber: "",
    registrationCouncil: "",
    registrationYear: "",
    bio: "",
    consultationFee: "",
    languagesSpoken: "",
    awards: ""
  });

  // Calculate progress
  const filledFields = Object.values(form).filter(v => v !== "").length;
  const totalFields = Object.keys(form).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    // If already complete, go to dashboard
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/doctor/profile/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.profileComplete) {
        navigate("/Doctor/dashboard");
      }
    } catch (err) {
      console.error("Status check failed", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (!form.specialization) {
      showToast("Specialization is required!", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
        registrationYear: form.registrationYear ? parseInt(form.registrationYear) : null,
        consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
      };

      await axios.post(`${API}/api/doctor/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast("Profile saved successfully! 🎉");
      setTimeout(() => navigate("/Doctor/dashboard"), 1500);

    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save profile";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/Doctor/dashboard");
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <div className="badge">One-time Setup</div>
          <h1>Complete Your Doctor Profile</h1>
          <p>Fill in your professional details so patients can find and trust you</p>
        </div>

        {/* Progress */}
        <div className="progress-wrap">
          <span className="progress-label">Profile Completion</span>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-pct">{progress}%</span>
        </div>

        {/* ── Section 1: Professional Info ── */}
        <div className="profile-card">
          <div className="card-section-title">
            <div className="section-icon">🩺</div>
            Professional Information
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Specialization <span className="required">*</span></label>
              <select name="specialization" value={form.specialization} onChange={handleChange}>
                <option value="">Select Specialization</option>
                {SPECIALIZATIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Qualification</label>
              <input
                name="qualification"
                placeholder="e.g. MBBS, MD, DM"
                value={form.qualification}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Experience (Years)</label>
              <input
                type="number"
                name="experienceYears"
                placeholder="e.g. 10"
                min="0"
                max="60"
                value={form.experienceYears}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Consultation Fee (₹)</label>
              <input
                type="number"
                name="consultationFee"
                placeholder="e.g. 500"
                min="0"
                value={form.consultationFee}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Languages Spoken</label>
              <input
                name="languagesSpoken"
                placeholder="e.g. Hindi, English, Punjabi"
                value={form.languagesSpoken}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Registration ── */}
        <div className="profile-card">
          <div className="card-section-title">
            <div className="section-icon">📋</div>
            Medical Registration
          </div>

          <div className="form-grid three-col">
            <div className="form-group">
              <label>Registration Number</label>
              <input
                name="registrationNumber"
                placeholder="e.g. MCI-12345"
                value={form.registrationNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Registration Council</label>
              <select name="registrationCouncil" value={form.registrationCouncil} onChange={handleChange}>
                <option value="">Select Council</option>
                {COUNCILS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Registration Year</label>
              <input
                type="number"
                name="registrationYear"
                placeholder="e.g. 2015"
                min="1950"
                max={new Date().getFullYear()}
                value={form.registrationYear}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: About ── */}
        <div className="profile-card">
          <div className="card-section-title">
            <div className="section-icon">✍️</div>
            About You
          </div>

          <div className="form-grid one-col">
            <div className="form-group">
              <label>Bio / About</label>
              <textarea
                name="bio"
                placeholder="Write a short professional bio that patients will see..."
                value={form.bio}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Awards & Achievements</label>
              <textarea
                name="awards"
                placeholder="e.g. Best Doctor Award 2022, National Health Excellence Award..."
                value={form.awards}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="submit-wrap">
            <button className="btn-skip" onClick={handleSkip}>
              Skip for now
            </button>
            <button className="btn-save" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Save Profile ✓"}
            </button>
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default DoctorCompleteProfile;