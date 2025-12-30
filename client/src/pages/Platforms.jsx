import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Eye, Save, X, Building2, Search } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';

const Platforms = () => {
    const [platforms, setPlatforms] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ nome: '', empresa_fund: '', empresa_respo: '', data_fund: '' });

    // Filtering and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchPlatforms();
        fetchCompanies();
    }, [page, searchTerm]);

    const fetchPlatforms = () => {
        setLoading(true);
        fetch(`/api/platforms?q=${searchTerm}&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setPlatforms(data.items);
                setTotal(data.total);
                setLoading(false);
            });
    };

    const fetchCompanies = () => {
        fetch('/api/companies').then(res => res.json()).then(data => setCompanies(data));
    };

    const fetchPlatformDetail = (nro) => {
        fetch(`/api/platforms/${nro}`).then(res => res.json()).then(data => setSelectedPlatform(data));
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ nome: '', empresa_fund: '', empresa_respo: '', data_fund: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (p) => {
        setEditMode(true);
        setFormData({
            nro: p.nro,
            nome: p.nome,
            empresa_fund: p.empresa_fund,
            empresa_respo: p.empresa_respo,
            data_fund: p.data_fund.split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editMode ? `/api/platforms/${formData.nro}` : '/api/platforms';
        const method = editMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                empresa_fund: parseInt(formData.empresa_fund),
                empresa_respo: parseInt(formData.empresa_respo)
            })
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchPlatforms();
        }
    };

    return (
        <div className="main-content">
            <section className="hero-section">
                <div className="action-bar">
                    <div>
                        <h2>Plataformas</h2>
                        <p className="subtitle">Configuração de provedores de streaming</p>
                    </div>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar por nome..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} /> Nova Plataforma
                    </button>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: selectedPlatform ? '1fr 400px' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
                <div className="list-view">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Criação</th>
                                <th>Users</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platforms.map((p) => (
                                <tr key={p.nro} style={{ cursor: 'pointer' }} onClick={() => fetchPlatformDetail(p.nro)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: 'var(--brand-muted)', color: 'var(--brand)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <Globe size={16} />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{p.nome}</span>
                                        </div>
                                    </td>
                                    <td>{new Date(p.data_fund).toLocaleDateString()}</td>
                                    <td>
                                        <span style={{ background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {p.qtd_users}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ fontSize: '0.75rem', height: 'auto', padding: '0.4rem 0.8rem' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}>
                                                EDIT
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '0.5rem', height: 'auto' }} onClick={(e) => { e.stopPropagation(); fetchPlatformDetail(p.nro); }}>
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        total={total}
                        page={page}
                        limit={10}
                        onPageChange={setPage}
                    />
                </div>

                {selectedPlatform && (
                    <div className="detail-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Detalhes</h3>
                            <button className="btn" style={{ height: 'auto', padding: '4px' }} onClick={() => setSelectedPlatform(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Identificador Natural</label>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>#{selectedPlatform.nro}</div>
                            </div>
                            <div className="form-group">
                                <label>Status Corporativo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand)', fontWeight: 600 }}>
                                    <Building2 size={16} />
                                    <span>ID Fundadora: {selectedPlatform.empresa_fund}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Canais Vinculados</label>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {selectedPlatform.channels?.map(c => (
                                        <div key={c.id} style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                                            <div style={{ fontWeight: 600 }}>{c.nome}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.tipo} • {c.qtd_visualizacoes} views</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn btn-danger" style={{ width: '100%', marginTop: 'auto' }} onClick={() => {
                                if (confirm('Remover plataforma?')) fetch(`/api/platforms/${selectedPlatform.nro}`, { method: 'DELETE' }).then(() => { fetchPlatforms(); setSelectedPlatform(null); });
                            }}>
                                <Trash2 size={18} /> Remover Registro
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Editar Plataforma" : "Nova Plataforma"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome da Plataforma</label><input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Twitch" /></div>
                    <div className="form-group">
                        <label>Empresa Fundadora</label>
                        <SearchableSelect
                            options={companies}
                            value={formData.empresa_fund}
                            onChange={(val) => setFormData({ ...formData, empresa_fund: val })}
                            placeholder="Pesquisar empresa..."
                            valueKey="nro"
                        />
                    </div>
                    <div className="form-group">
                        <label>Empresa Responsável</label>
                        <SearchableSelect
                            options={companies}
                            value={formData.empresa_respo}
                            onChange={(val) => setFormData({ ...formData, empresa_respo: val })}
                            placeholder="Pesquisar empresa..."
                            valueKey="nro"
                        />
                    </div>
                    <div className="form-group"><label>Data de Fundação</label><input type="date" required value={formData.data_fund} onChange={e => setFormData({ ...formData, data_fund: e.target.value })} /></div>
                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editMode ? "Salvar Alterações" : "Finalizar Cadastro"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Platforms;
