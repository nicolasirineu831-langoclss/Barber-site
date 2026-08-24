import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA02I0J1BTa2f12sw0p0zQhC-5SpdktZWw",
  authDomain: "barberpro-suaempresa.firebaseapp.com",
  projectId: "barberpro-suaempresa",
  storageBucket: "barberpro-suaempresa.firebasestorage.app",
  messagingSenderId: "771293688610",
  appId: "1:771293688610:web:a52dee87daf2b2debe6b7b",
  measurementId: "G-9B391FDLV2"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
