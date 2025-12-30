import { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, RefreshCw, Filter, Layers } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import FilterBar from '../components/FilterBar';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsPage = () => {
    const [revenueData, setRevenueData] = useState([]);
    const [themeData, setThemeData] = useState([]);
    const [platformData, setPlatformData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filters, setFilters] = useState({});

    const fetchData = async (currFilters) => {
        setLoading(true);
        const cleanFilters = Object.entries(currFilters).reduce((acc, [key, val]) => {
            if (val !== '' && val !== null && val !== undefined) acc[key] = val;
            return acc;
        }, {});

        const queryParams = new URLSearchParams(cleanFilters).toString();
        try {
            const [rev, theme, plat] = await Promise.all([
                fetch(`/api/reports/revenue-over-time?${queryParams}`).then(res => res.json()),
                fetch(`/api/reports/distribution-by-theme?${queryParams}`).then(res => res.json()),
                fetch(`/api/reports/drilldown-performance?${queryParams}`).then(res => res.json())
            ]);
            setRevenueData(Array.isArray(rev) ? [...rev].reverse() : []);
            setThemeData(Array.isArray(theme) ? theme : []);
            setPlatformData(Array.isArray(plat) ? plat : []);
        } catch (error) {
            console.error(error);
            setRevenueData([]);
            setThemeData([]);
            setPlatformData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(filters);
    }, [filters]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetch('/api/reports/refresh', { method: 'POST' });
        await fetchData(filters);
        setIsRefreshing(false);
    };

    // Chart configs
    const revenueChart = {
        labels: revenueData.map(d => d.month),
        datasets: [{
            label: 'Monthly Revenue ($)',
            data: revenueData.map(d => d.total),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const themeChart = {
        labels: themeData.slice(0, 5).map(d => d.tema),
        datasets: [{
            data: themeData.slice(0, 5).map(d => d.count),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        }]
    };

    const platformChart = {
        labels: platformData.slice(0, 12).map(d => d.entity_name),
        datasets: [{
            label: 'Views Totais',
            data: platformData.slice(0, 12).map(d => d.total_views),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
        }, {
            label: filters.channel_id ? 'Pico de Audiência' : 'Volatilidade (Total Vídeos)',
            data: platformData.slice(0, 12).map(d => filters.channel_id ? d.peak_views : d.total_items),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }]
    };

    return (
        <div className="main-content">
            <section className="hero-section">
                <div className="action-bar">
                    <div>
                        <h2>Data Warehouse Analytics</h2>
                        <p className="subtitle">Drill-down estratégico e inteligência de mercado</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Re-indexando...' : 'Sincronizar'}
                        </button>
                        <button className="btn btn-primary">
                            <Layers size={18} /> Exportar
                        </button>
                    </div>
                </div>

                <FilterBar onFilterChange={setFilters} />
            </section>

            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                <div className="kpi-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <TrendingUp size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0 }}>Crescimento Financeiro</h3>
                    </div>
                    <div style={{ height: '350px' }}>
                        <Line key={`revenue-${JSON.stringify(filters)}`} data={revenueChart} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <PieChart size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0 }}>Distribuição por Tema</h3>
                    </div>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Pie key={`theme-${JSON.stringify(filters)}`} data={themeChart} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <BarChart3 size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0 }}>Performance por Plataforma</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Bar key={`platform-${JSON.stringify(filters)}`} data={platformChart} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="list-view" style={{ gridColumn: 'span 2' }}>
                    <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                            {filters.channel_id ? 'Performance Detalhada por Vídeo' : 'Performance por Canal'}
                        </h3>
                        <Filter size={18} color="var(--text-muted)" />
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{filters.channel_id ? 'Vídeo' : 'Canal'}</th>
                                <th>{filters.channel_id ? 'Pico Simultâneo' : 'Total Vídeos'}</th>
                                <th>Views Acumuladas</th>
                                <th style={{ textAlign: 'right' }}>Receita Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platformData.map((plat, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{plat.entity_name}</td>
                                    <td>{filters.channel_id ? plat.peak_views : plat.total_items}</td>
                                    <td>{(plat.total_views || 0).toLocaleString()}</td>
                                    <td className="value-cell" style={{ textAlign: 'right' }}>
                                        $ {(plat.total_revenue || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
