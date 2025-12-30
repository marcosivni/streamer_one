import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Globe, Users, Tv, Film, DollarSign, TrendingUp } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <TrendingUp size={20} /> },
        { name: 'Plataformas', path: '/platforms', icon: <Globe size={20} /> },
        { name: 'Usuários', path: '/users', icon: <Users size={20} /> },
        { name: 'Canais', path: '/channels', icon: <Tv size={20} /> },
        { name: 'Vídeos', path: '/videos', icon: <Film size={20} /> },
        { name: 'Doações', path: '/donations', icon: <DollarSign size={20} /> },
    ];

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="logo-section">
                    <div className="logo-icon">SD</div>
                    <span className="logo-text">StreamerData <span>One</span></span>
                </div>

                <div className="desktop-menu">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
