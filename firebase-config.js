/**
 * Configuração do Firebase — BarberPro
 *
 * Como preencher:
 * 1. Acesse https://console.firebase.google.com e crie um projeto novo
 *    (ex: "barberpro-suaempresa"). Pode ser gratuito (plano Spark).
 * 2. No projeto, vá em "Build > Firestore Database" e clique em "Criar banco de dados"
 *    (modo produção, região "southamerica-east1" se quiser servidor no Brasil).
 * 3. Vá em "Build > Authentication > Sign-in method" e ative "E-mail/senha".
 * 4. Vá em Configurações do projeto (ícone de engrenagem) > Geral > "Seus apps"
 *    e crie um app da Web (</>). Copie o objeto firebaseConfig gerado e cole abaixo.
 */

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
