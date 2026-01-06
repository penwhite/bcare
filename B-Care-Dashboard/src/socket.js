// src/socket.js
import { io } from "socket.io-client";

// We no longer send a JWT; just connect to the server
const SERVER_URL = "https://b-care-server-mohammad.onrender.com";
export const socket = io(SERVER_URL, {
  transports: ["websocket"],
});
