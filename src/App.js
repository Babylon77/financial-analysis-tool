import React from 'react';
import { HashRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import Finance from './pages/Finance';

// Use HashRouter for GitHub Pages and BrowserRouter for Netlify or local development
const isGitHubPages = window.location.hostname.includes('github.io');
// For Netlify, we'll use BrowserRouter as Netlify handles SPA routing with redirects
const Router = isGitHubPages ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router basename={isGitHubPages ? '' : '/'}>
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