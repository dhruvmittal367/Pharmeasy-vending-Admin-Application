import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import axios from "axios";
import { io } from "socket.io-client";
import "../../css/DoctorDashboard.css";
import DoctorSidebar from "./DoctorSidebar";

const API = "http://localhost:8082";
const SOCKET_URL = "http://localhost:8080";

// ── Helpers ────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

const isPastAppointment = (apt) => {
  const dateStr = apt.appointment_date?.slice(0, 10);
  const timeStr = apt.appointment_time || "00:00:00";
  const [year, month, day] = dateStr.split("-").map(Number);
  const [h, m, s] = timeStr.split(":").map(Number);
  const aptDateTime = new Date(year, month - 1, day, h, m, s || 0);
  return aptDateTime < new Date() && apt.status !== "cancelled";
};

// ── Single Appointment Card ────────────────────────────────
const AppointmentCard = ({ apt }) => {
  const isPast = isPastAppointment(apt);
  return (
    <div
      className="appointment-item"
      style={{
        borderLeftColor:
          apt.status === "cancelled" ? "#f44336" : isPast ? "#9e9e9e" : "#4CAF50",
        opacity: isPast ? 0.85 : 1,
      }}
    >
      <div className="apt-time">
        <span
          className="time-badge"
          style={{
            background:
              apt.status === "cancelled" ? "#f44336" : isPast ? "#9e9e9e" : "#667eea",
          }}
        >
          {formatTime(apt.appointment_time)}
        </span>
      </div>
      <div className="apt-details">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <h4 style={{ margin: 0 }}>{apt.patient_name || `Patient #${apt.patient_id}`}</h4>
          {isPast && <span className="past-badge">⏰ Past</span>}
        </div>
        <span className="apt-email">📧 {apt.patient_email || "N/A"}</span>
        <p style={{ margin: "2px 0" }}>{apt.reason || "General Checkup"}</p>
        <small>📅 {formatDate(apt.appointment_date)} • {apt.appointment_type}</small>
        {apt.status === "cancelled" && apt.cancelled_at && (
          <small className="cancelled-info">
            ❌ Cancelled: {formatDate(apt.cancelled_at)} at{" "}
            {formatTime(new Date(apt.cancelled_at).toTimeString().slice(0, 8))}
          </small>
        )}
      </div>
      <div className="apt-status">
        <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
function DoctorDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingPrescriptions: 0,
    totalRevenue: 0,
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [liveAppointments, setLiveAppointments] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchDoctorProfile();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!doctorProfile?.userId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_doctor_room", doctorProfile.userId);
    });
    socket.on("appointments_update", (data) => setLiveAppointments(data));
    socket.on("disconnect", () => setConnected(false));
    return () => socket.disconnect();
  }, [doctorProfile?.userId]);

  const fetchDoctorProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctorProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch doctor profile:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [patientsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        api.get("/api/patients").catch(() => ({ data: { data: [] } })),
        api.get("/api/appointments").catch(() => ({ data: { data: [] } })),
        api.get("/api/prescriptions").catch(() => ({ data: { data: [] } })),
      ]);
      const patients = patientsRes.data.data || [];
      const appointments = appointmentsRes.data.data || [];
      const prescriptions = prescriptionsRes.data.data || [];
      setStats({
        totalPatients: patients.length,
        todayAppointments: appointments.filter((apt) => isToday(apt.date)).length,
        pendingPrescriptions: prescriptions.filter((p) => p.status === "pending").length,
        totalRevenue: prescriptions.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      });
      setRecentPatients(patients.slice(0, 5));
      setRecentPrescriptions(prescriptions.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    return new Date().toDateString() === new Date(dateString).toDateString();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ⚡ Sort: date → time, upcoming first, past/cancelled last
  // ⚡ Sort: nearest upcoming first, then most recent past/cancelled
    const getSortedAppointments = () => {
      const upcoming = liveAppointments
        .filter((apt) => !isPastAppointment(apt) && apt.status !== "cancelled")
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.appointment_date?.slice(0, 10)}T${a.appointment_time || "00:00:00"}`);
          const dateTimeB = new Date(`${b.appointment_date?.slice(0, 10)}T${b.appointment_time || "00:00:00"}`);
          return dateTimeA - dateTimeB;
        });

      const pastAndCancelled = liveAppointments
        .filter((apt) => isPastAppointment(apt) || apt.status === "cancelled")
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.appointment_date?.slice(0, 10)}T${a.appointment_time || "00:00:00"}`);
          const dateTimeB = new Date(`${b.appointment_date?.slice(0, 10)}T${b.appointment_time || "00:00:00"}`);
          return dateTimeB - dateTimeA;
        });

      return [...upcoming, ...pastAndCancelled];
    };

  const sortedAppointments = getSortedAppointments();
  const first3 = sortedAppointments.slice(0, 3);
  const rest = sortedAppointments.slice(3);

  // ── Derived values ──────────────────────────────────────
  const doctorName = doctorProfile ? `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}` : "Dr. ...";
  const specialization = doctorProfile?.specialization || "General Physician";
  const experience = doctorProfile?.experienceYears ? `${doctorProfile.experienceYears} yrs exp` : null;
  const rating = doctorProfile?.rating || null;
  const consultationFee = doctorProfile?.consultationFee || null;
  const verificationStatus = doctorProfile?.verificationStatus || "PENDING";
  const initials = doctorProfile
    ? `${doctorProfile.firstName?.charAt(0)}${doctorProfile.lastName?.charAt(0)}`
    : "Dr";

  const quickActions = [
    { title: "Add Prescription", icon: "💊", color: "#4CAF50", action: () => navigate("/Doctor/medicine") },
    { title: "View Patients", icon: "👥", color: "#2196F3", action: () => navigate("/Doctor/patients") },
    { title: "Appointments", icon: "📅", color: "#FF9800", action: () => navigate("/Doctor/appointments") },
    { title: "Reports", icon: "📊", color: "#9C27B0", action: () => navigate("/Doctor/reports") },
  ];

  return (
    <div className="doctor-container">
      <DoctorSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`doctor-main ${sidebarOpen ? "main-shifted" : "main-full"}`}>

        {/* Toggle Button */}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Header */}
        <div className="dashboard-header2">
          <div className="welcome-section">
            <div className="doctor-identity">
              <div className="doctor-avatar-lg">{initials}</div>
              <div>
                <h1>Welcome back, {doctorName}! 👋</h1>
                <div className="doctor-meta-tags">
                  <span className="meta-tag tag-spec">🩺 {specialization}</span>
                  {experience && <span className="meta-tag tag-exp">⏱ {experience}</span>}
                  {consultationFee && <span className="meta-tag tag-fee">₹{consultationFee} / visit</span>}
                  <span className={`meta-tag tag-verify ${verificationStatus === "APPROVED" ? "verified" : "pending"}`}>
                    {verificationStatus === "APPROVED" ? "✅ Verified" : "⏳ Pending Verification"}
                  </span>
                </div>
                <p className="welcome-subtitle">Here's what's happening with your patients today</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            {rating > 0 && (
              <div className="rating-badge">
                <span className="rating-star">⭐</span>
                <span className="rating-val">{Number(rating).toFixed(1)}</span>
                <span className="rating-label">Rating</span>
              </div>
            )}
            <div className="date-display">
              <span className="date-icon">📅</span>
              <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <button className="btn-edit-profile" onClick={() => navigate("/Doctor/complete-profile")}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <div className="stat-icon">👥</div>
                <div className="stat-content"><h3>{stats.totalPatients}</h3><p>Total Patients</p></div>
                <div className="stat-trend"><span className="trend-up">↑ 12%</span></div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-icon">📅</div>
                <div className="stat-content"><h3>{liveAppointments.length}</h3><p>Total Appointments</p></div>
                <div className="stat-trend"><span className="trend-up">↑ 8%</span></div>
              </div>
              <div className="stat-card stat-orange">
                <div className="stat-icon">📝</div>
                <div className="stat-content"><h3>{stats.pendingPrescriptions}</h3><p>Pending Prescriptions</p></div>
                <div className="stat-trend"><span className="trend-down">↓ 3%</span></div>
              </div>
              <div className="stat-card stat-purple">
                <div className="stat-icon">💰</div>
                <div className="stat-content"><h3>₹{stats.totalRevenue.toLocaleString()}</h3><p>Total Revenue</p></div>
                <div className="stat-trend"><span className="trend-up">↑ 15%</span></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2 className="section-title">⚡ Quick Actions</h2>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <div key={index} className="quick-action-card" onClick={action.action} style={{ borderLeftColor: action.color }}>
                    <div className="action-icon" style={{ background: action.color + "20" }}>
                      <span style={{ fontSize: "2rem" }}>{action.icon}</span>
                    </div>
                    <h3>{action.title}</h3>
                    <p>Click to proceed →</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="dashboard-content-grid">

              {/* ⚡ Live Appointments Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>📅 Upcoming Appointments</h2>
                  <button className="view-all-btn" onClick={() => navigate("/Doctor/appointments")}>
                    View All →
                  </button>
                </div>
                <div className="card-content">
                  {liveAppointments.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📅</span>
                      <p>No appointments yet</p>
                    </div>
                  ) : (
                    <div className="apt-scroll-container">
                      <div className="appointments-list">
                        {getSortedAppointments().map((apt, index) => (
                          <AppointmentCard key={index} apt={apt} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Recent Patients */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>👥 Recent Patients</h2>
                  <button className="view-all-btn" onClick={() => navigate("/Doctor/patients")}>View All →</button>
                </div>
                <div className="card-content">
                  {recentPatients.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">👥</span><p>No recent patients</p></div>
                  ) : (
                    <div className="patients-list">
                      {recentPatients.map((patient, index) => (
                        <div key={index} className="patient-item">
                          <div className="patient-avatar"><span>{patient.name?.charAt(0) || "P"}</span></div>
                          <div className="patient-details">
                            <h4>{patient.name || "Patient Name"}</h4>
                            <p>{patient.age || "N/A"} years • {patient.gender || "N/A"}</p>
                          </div>
                          <div className="patient-action">
                            <button className="btn-small" onClick={() => {
                              localStorage.setItem("selectedPatient", JSON.stringify(patient));
                              navigate("/Doctor/medicine");
                            }}>Add Rx</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Prescriptions */}
              <div className="dashboard-card dashboard-card-full">
                <div className="card-header">
                  <h2>💊 Recent Prescriptions</h2>
                  <button className="view-all-btn" onClick={() => navigate("/Doctor/prescriptions")}>View All →</button>
                </div>
                <div className="card-content">
                  {recentPrescriptions.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon">💊</span><p>No recent prescriptions</p></div>
                  ) : (
                    <div className="prescriptions-table-wrapper">
                      <table className="prescriptions-table">
                        <thead>
                          <tr>
                            <th>Patient Name</th><th>Date</th><th>Medicines</th>
                            <th>Amount</th><th>Status</th><th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPrescriptions.map((prescription, index) => (
                            <tr key={index}>
                              <td><strong>{prescription.patient?.name || "N/A"}</strong></td>
                              <td>{prescription.date ? new Date(prescription.date).toLocaleDateString() : "N/A"}</td>
                              <td>{prescription.medicines?.length || 0} items</td>
                              <td>₹{prescription.totalAmount || 0}</td>
                              <td>
                                <span className={`status-badge status-${prescription.status || "pending"}`}>
                                  {prescription.status || "Pending"}
                                </span>
                              </td>
                              <td><button className="btn-icon" title="View Details">👁️</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="activity-summary">
              <div className="activity-card">
                <h3>📊 This Week's Summary</h3>
                <div className="activity-stats">
                  <div className="activity-item">
                    <span className="activity-label">Patients Treated</span>
                    <span className="activity-value">{doctorProfile?.totalConsultations || 0}</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-label">Prescriptions Written</span>
                    <span className="activity-value">{stats.pendingPrescriptions}</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-label">Appointments Completed</span>
                    <span className="activity-value">{stats.todayAppointments}</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-label">Average Rating</span>
                    <span className="activity-value">
                      {doctorProfile?.rating > 0 ? `${Number(doctorProfile.rating).toFixed(1)} ⭐` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;