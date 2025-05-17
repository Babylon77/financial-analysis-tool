import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import Finance from './pages/Finance';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/real-estate" element={<Calculator />} />
          <Route path="/results" element={<Results />} />
          <Route path="/finance" element={<Finance />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 