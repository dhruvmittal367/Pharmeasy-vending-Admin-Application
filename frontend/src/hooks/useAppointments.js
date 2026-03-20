import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";

let socket;

const useAppointments = (doctorId) => {
  const [appointments, setAppointments] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!doctorId) return;

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      setConnected(true);
      socket.emit("join_doctor_room", doctorId);
    });

    socket.on("appointments_update", (data) => {
      console.log("⚡ Live appointments:", data);
      setAppointments(data);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorId]);

  return { appointments, connected };
};

export default useAppointments;