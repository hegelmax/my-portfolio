import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

//import "./assets/css/animsition.min.css";
import "./assets/css/bootstrap.min.css";
//import "./assets/css/fontello.min.css";
//import "./assets/css/magnific-popup.min.css";
//import "./assets/css/unused.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
