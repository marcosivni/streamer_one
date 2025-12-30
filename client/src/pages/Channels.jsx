import { useState, useEffect } from 'react';
import { Tv, Plus, Trash2, Eye, Save, X, Search } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';

const ChannelsPage = () => {
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ nome: '', tipo: 'publico', data: '', descricao: '', id_streamer: '', nro_plataforma: '' });

    // Filtering and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchItems();
        fetchUsers();
        fetchPlatforms();
    }, [page, searchTerm]);

    const fetchItems = () => {
        setLoading(true);
        fetch(`/api/channels?q=${searchTerm}&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setItems(data.items);
                setTotal(data.total);
                setLoading(false);
            });
    };

    const fetchUsers = () => fetch('/api/users').then(res => res.json()).then(data => setUsers(data.items || data));
    const fetchPlatforms = () => fetch('/api/platforms').then(res => res.json()).then(data => setPlatforms(data.items || data));

    const fetchDetail = (id) => {
        fetch(`/api/channels/${id}`).then(res => res.json()).then(data => setSelected(data));
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ nome: '', tipo: 'publico', data: '', descricao: '', id_streamer: '', nro_plataforma: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (i) => {
        setEditMode(true);
        setFormData({
            id: i.id,
            nome: i.nome,
            tipo: i.tipo,
            data: i.data.split('T')[0],
            descricao: i.descricao,
            id_streamer: i.id_streamer,
            nro_plataforma: i.nro_plataforma
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editMode ? `/api/channels/${formData.id}` : '/api/channels';
        const method = editMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, id_streamer: parseInt(formData.id_streamer), nro_plataforma: parseInt(formData.nro_plataforma) })
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchItems();
        }
    };

    return (
        <div className="main-content">
            <section className="hero-section">
                <div className="action-bar">
                    <div>
                        <h2>Canais de Transmissão</h2>
                        <p className="subtitle">Gestão de ativos digitais e redes de streamers</p>
                    </div>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar canal por nome..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} /> Novo Canal
                    </button>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 450px' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
                <div className="list-view">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome do Canal</th>
                                <th>Streamer</th>
                                <th>Rede</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={i.id}>
                                    <td onClick={() => fetchDetail(i.id)} style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <Tv size={16} color="var(--brand)" />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{i.nome}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{i.streamer_nick}</td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{i.platform_name}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ fontSize: '0.75rem', height: 'auto', padding: '0.4rem 0.8rem' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(i); }}>
                                                EDIT
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '0.5rem', height: 'auto' }} onClick={(e) => { e.stopPropagation(); fetchDetail(i.id); }}>
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

                {selected && (
                    <div className="detail-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {selected.tipo} Channel
                                </span>
                                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem' }}>{selected.nome}</h3>
                            </div>
                            <button className="btn" style={{ height: 'auto', padding: '4px' }} onClick={() => setSelected(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MÉTRICA TOTAL</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selected.qtd_visualizacoes?.toLocaleString() || 0}</div>
                            </div>
                            <div style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ATIVO DESDE</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{new Date(selected.data).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Produções Recentes</h4>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {selected.videos?.slice(0, 3).map(v => (
                                    <div key={v.id_video} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px' }}><Tv size={14} /></div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{v.titulo}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '3rem' }} onClick={() => {
                            if (confirm('Excluir canal?')) fetch(`/api/channels/${selected.id}`, { method: 'DELETE' }).then(() => { fetchItems(); setSelected(null); });
                        }}>
                            <Trash2 size={18} /> Encerrar Operações do Canal
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Editar Ativo Digital" : "Novo Ativo Digital"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome do Canal</label><input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Master League" /></div>
                    <div className="form-group">
                        <label>Responsável (Streamer)</label>
                        <SearchableSelect
                            options={users}
                            value={formData.id_streamer}
                            onChange={(val) => setFormData({ ...formData, id_streamer: val })}
                            placeholder="Buscar streamer..."
                            labelKey="nick"
                            valueKey="id"
                        />
                    </div>
                    <div className="form-group">
                        <label>Plataforma Host</label>
                        <SearchableSelect
                            options={platforms}
                            value={formData.nro_plataforma}
                            onChange={(val) => setFormData({ ...formData, nro_plataforma: val })}
                            placeholder="Selecionar plataforma..."
                            labelKey="nome"
                            valueKey="nro"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipo de Conteúdo</label>
                        <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                            <option value="misto">Misto (Gaming & Talk)</option>
                            <option value="publico">Aberto / Público</option>
                            <option value="privado">Exclusivo / Privado</option>
                        </select>
                    </div>
                    <div className="form-group"><label>Data de Lançamento</label><input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} /></div>
                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editMode ? "Salvar Alterações" : "Publicar Canal"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ChannelsPage;
