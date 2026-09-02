import './App.css';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Problema } from './components/Problema';
import { ComoFunciona } from './components/ComoFunciona';
import { ProvaEmUso } from './components/ProvaEmUso';
import { Diferencial } from './components/Diferencial';
import { CtaFinal } from './components/CtaFinal';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="landing">
      <Nav />
      <Hero />
      <Problema />
      <ComoFunciona />
      <ProvaEmUso />
      <Diferencial />
      <CtaFinal />
      <Footer />
    </div>
  );
}
