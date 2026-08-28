const firebaseConfig = {
  apiKey: "AIzaSyA02I0J1BTa2f12sw0p0zQhC-5SpdktZWw",
  authDomain: "barberpro-suaempresa.firebaseapp.com",
  projectId: "barberpro-suaempresa",
  storageBucket: "barberpro-suaempresa.firebasestorage.app",
  messagingSenderId: "771293688610",
  appId: "1:771293688610:web:a52dee87daf2b2debe6b7b",
  measurementId: "G-9B391FDLV2"
};

firebase.initializeApp(firebaseConfig);

// App Check: garante que só o próprio site (esse domínio) consegue falar com o Firebase.
// A chave abaixo é a "chave de site" pública do reCAPTCHA Enterprise (não é segredo).
firebase.appCheck().activate(
  new firebase.appCheck.ReCaptchaEnterpriseProvider('6LcqJ5wtAAAAALka6U0BcNjF-h2t9Th_P4NMAwOi'),
  true // renova o token automaticamente
);

const auth = firebase.auth();
const db = firebase.firestore();
