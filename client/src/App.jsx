import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Platforms from './pages/Platforms';
import Users from './pages/Users';
import Channels from './pages/Channels';
import Videos from './pages/Videos';
import Donations from './pages/Donations';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/platforms" element={<Platforms />} />
          <Route path="/users" element={<Users />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/donations" element={<Donations />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
