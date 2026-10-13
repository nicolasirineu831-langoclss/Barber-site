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

// App Check (reCAPTCHA Enterprise): DESLIGADO por padrão, porque estava travando
// o login e o cadastro (auth/network-request-failed). Para ligar de novo (depois de
// autorizar o domínio do site na chave do reCAPTCHA), abra o site com ?appcheck=1.
var APPCHECK_PULADO = !/[?&]appcheck=1/.test(location.search);
if (!APPCHECK_PULADO) {
  try {
    firebase.appCheck().activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6LcqJ5wtAAAAALka6U0BcNjF-h2t9Th_P4NMAwOi'),
      true // renova o token automaticamente
    );
  } catch (e) {
    window.APPCHECK_ERRO = String(e && (e.code || e.message) || e);
    console.error('App Check não pôde ser ativado:', e);
  }
}

const auth = firebase.auth();
const db = firebase.firestore();
