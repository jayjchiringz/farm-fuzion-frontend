import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:5001/farm-fuzion/us-central1/api",
  headers: {
    "Content-Type": "application/json",
  },
});
