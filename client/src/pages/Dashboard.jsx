import { useEffect, useState } from 'react'
import { Activity, Crown, Gem, TrendingUp, DollarSign, RefreshCcw, Play, Users } from 'lucide-react'
import FilterBar from '../components/FilterBar'

const Dashboard = () => {
    const [status, setStatus] = useState({ message: 'Conectando...', db_status: 'unknown' })
    const [ranking, setRanking] = useState([])
    const [videos, setVideos] = useState([])
    const [streamers, setStreamers] = useState([])
    const [viewers, setViewers] = useState([])

    const [filterLimit, setFilterLimit] = useState(10)
    const [globalFilters, setGlobalFilters] = useState({})
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchAllRankings = (limit, filters) => {
        const cleanFilters = Object.entries(filters).reduce((acc, [key, val]) => {
            if (val !== '' && val !== null && val !== undefined) acc[key] = val;
            return acc;
        }, {});

        const queryParams = new URLSearchParams({
            limit: limit,
            ...cleanFilters
        }).toString();

        fetch(`/api/ranking/faturamento?${queryParams}`)
            .then(res => res.json())
            .then(data => setRanking(Array.isArray(data) ? data : []))
            .catch(() => setRanking([]))

        fetch(`/api/ranking/videos-virais?${queryParams}`)
            .then(res => res.json())
            .then(data => setVideos(Array.isArray(data) ? data : []))
            .catch(() => setVideos([]))

        fetch(`/api/ranking/streamers?limit=${limit}`)
            .then(res => res.json())
            .then(data => setStreamers(Array.isArray(data) ? data : []))
            .catch(() => setStreamers([]))

        fetch(`/api/ranking/top-viewers?${queryParams}`)
            .then(res => res.json())
            .then(data => setViewers(Array.isArray(data) ? data : []))
            .catch(() => setViewers([]))
    }

    useEffect(() => {
        fetch('/api/').then(res => res.json()).then(data => setStatus(data))
    }, [])

    useEffect(() => {
        fetchAllRankings(filterLimit, globalFilters)
    }, [filterLimit, globalFilters])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetch('/api/reports/refresh', { method: 'POST' })
        fetchAllRankings(filterLimit, globalFilters)
        setIsRefreshing(false)
    }

    return (
        <div className="main-content">
            <section className="hero-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2>Dashboard Operacional</h2>
                        <p className="subtitle">Visão geral em tempo real de performance e engajamento</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>LIMIT</span>
                            <select
                                value={filterLimit}
                                onChange={(e) => setFilterLimit(e.target.value)}
                                style={{ border: 'none', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                            >
                                <option value={5}>Top 5</option>
                                <option value={10}>Top 10</option>
                                <option value={20}>Top 20</option>
                            </select>
                        </div>
                        <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            Sincronizar
                        </button>
                    </div>
                </div>

                <FilterBar onFilterChange={setGlobalFilters} />
            </section>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="kpi-title">Top Performance</span>
                        <Crown size={20} color="var(--brand)" />
                    </div>
                    <div className="kpi-value">{streamers[0]?.nick || '---'}</div>
                    <div className="kpi-label">{(streamers[0]?.audiencia || 0).toLocaleString()} Audiência</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="kpi-title">Faturamento Líder</span>
                        <DollarSign size={20} color="var(--status-success)" />
                    </div>
                    <div className="kpi-value">${(ranking[0]?.faturamento / 1000 || 0).toFixed(1)}k</div>
                    <div className="kpi-label">{ranking[0]?.nome_canal || 'Global'}</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="kpi-title">Top Apoiador</span>
                        <Gem size={20} color="var(--brand-light)" />
                    </div>
                    <div className="kpi-value">{viewers[0]?.nick || '---'}</div>
                    <div className="kpi-label">${(viewers[0]?.total_doado || 0).toLocaleString()} Doações</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="kpi-title">Sistema</span>
                        <Activity size={20} color={status.db_status === 'connected' ? 'var(--status-success)' : 'var(--status-error)'} />
                    </div>
                    <div className="kpi-value">{status.db_status === 'connected' ? 'Ativo' : 'Erro'}</div>
                    <div className="kpi-label">{status.message}</div>
                </div>
            </div>

            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="list-view">
                    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <TrendingUp size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Canais Mais Rentáveis</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Canal</th>
                                <th style={{ textAlign: 'right' }}>Receita</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((row) => (
                                <tr key={row.id_canal}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{row.rank}</td>
                                    <td style={{ fontWeight: 600 }}>{row.nome_canal}</td>
                                    <td className="value-cell" style={{ textAlign: 'right' }}>
                                        $ {(row.faturamento || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="list-view">
                    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <Play size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Conteúdo Viral</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vídeo</th>
                                <th>Engajamento</th>
                                <th style={{ textAlign: 'right' }}>Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.map((v, idx) => (
                                <tr key={idx}>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{v.titulo}</td>
                                    <td>
                                        <div style={{ width: '100%', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--brand-muted)', color: 'var(--brand)', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center' }}>
                                            {(v.taxa_engajamento * 100).toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="value-cell" style={{ textAlign: 'right' }}>{v.visu_total?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="list-view">
                    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <Users size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Performance de Streamers</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nick</th>
                                <th>Canais</th>
                                <th style={{ textAlign: 'right' }}>Audiência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {streamers.map((s, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{s.nick}</td>
                                    <td style={{ textAlign: 'center' }}>{s.canais}</td>
                                    <td className="value-cell" style={{ textAlign: 'right' }}>{s.audiencia?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="list-view">
                    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <Gem size={20} color="var(--brand)" />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Maiores Doadores</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Vídeos Apoiados</th>
                                <th style={{ textAlign: 'right' }}>Total Doado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewers.map((u, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{u.nick}</td>
                                    <td style={{ textAlign: 'center' }}>{u.videos_apoiados}</td>
                                    <td className="value-cell" style={{ textAlign: 'right' }}>$ {(u.total_doado || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
