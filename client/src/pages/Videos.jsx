import { useState, useEffect } from 'react';
import { Film, Plus, Trash2, Eye, Save, X, Layers, PlayCircle, Users, Search } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';

const VideosPage = () => {
    const [items, setItems] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id_canal: '', titulo: '', datah: '', tema: '', duracao: '', visu_simul: 0, visu_total: 0 });

    // Filtering and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchItems();
        fetchChannels();
    }, [page, searchTerm]);

    const fetchItems = () => {
        setLoading(true);
        fetch(`/api/videos?q=${searchTerm}&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setItems(data.items);
                setTotal(data.total);
                setLoading(false);
            });
    };

    const fetchChannels = () => fetch('/api/channels').then(res => res.json()).then(data => setChannels(data.items || data));

    const fetchDetail = (id_canal, id_video) => {
        fetch(`/api/videos/${id_canal}/${id_video}`).then(res => res.json()).then(data => setSelected(data));
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ id_canal: '', titulo: '', datah: '', tema: '', duracao: '', visu_simul: 0, visu_total: 0 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (v) => {
        setEditMode(true);
        setFormData({
            id_video: v.id_video,
            id_canal: v.id_canal,
            titulo: v.titulo,
            datah: v.datah.substring(0, 16),
            tema: v.tema,
            duracao: v.duracao,
            visu_simul: v.visu_simul,
            visu_total: v.visu_total
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editMode ? `/api/videos/${formData.id_canal}/${formData.id_video}` : '/api/videos';
        const method = editMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, id_canal: parseInt(formData.id_canal), duracao: parseInt(formData.duracao), visu_simul: parseInt(formData.visu_simul), visu_total: parseInt(formData.visu_total) })
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
                        <h2>Produção de Vídeo</h2>
                        <p className="subtitle">Relatórios de audiência e engajamento por mídia</p>
                    </div>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar vídeo por título..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} /> Novo Vídeo
                    </button>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 500px' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
                <div className="list-view">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Título do Vídeo</th>
                                <th>Canal</th>
                                <th>Visualizações</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={`${i.id_canal}-${i.id_video}`} style={{ cursor: 'pointer' }} onClick={() => fetchDetail(i.id_canal, i.id_video)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ color: 'var(--brand)' }}><PlayCircle size={20} /></div>
                                            <span style={{ fontWeight: 600 }}>{i.titulo}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{i.canal_nome}</td>
                                    <td className="value-cell">{i.visu_total?.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ fontSize: '0.75rem', height: 'auto', padding: '0.4rem 0.8rem' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(i); }}>
                                                EDIT
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '0.5rem', height: 'auto' }} onClick={(e) => { e.stopPropagation(); fetchDetail(i.id_canal, i.id_video); }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Layers size={20} color="var(--brand)" />
                                <h3 style={{ margin: 0 }}>Análise de Conteúdo</h3>
                            </div>
                            <button className="btn" style={{ height: 'auto', padding: '4px' }} onClick={() => setSelected(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tema: {selected.tema}</div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{selected.titulo}</h2>
                            <div style={{ color: 'var(--brand)', fontWeight: 600, marginTop: '0.5rem' }}>Canal {selected.canal_nome}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DURAÇÃO</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selected.duracao} min</div>
                            </div>
                            <div style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SIMULTÂNEOS</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selected.visu_simul}</div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Relatório de Doações</h4>
                            {selected.donations?.length > 0 ? (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {selected.donations.map((d, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Users size={14} color="var(--text-muted)" />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.nick}</span>
                                            </div>
                                            <span className="value-cell" style={{ fontSize: '0.9rem' }}>+${d.valor}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="subtitle">Nenhuma doação rastreada neste vídeo.</p>}
                        </div>

                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '3rem' }} onClick={() => {
                            if (confirm('Excluir mídia?')) fetch(`/api/videos/${selected.id_canal}/${selected.id_video}`, { method: 'DELETE' }).then(() => { fetchItems(); setSelected(null); });
                        }}>
                            <Trash2 size={18} /> Remover do Sistema
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Editar Mídia" : "Nova Mídia"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Canal de Origem</label>
                        <SearchableSelect
                            options={channels}
                            value={formData.id_canal}
                            onChange={(val) => setFormData({ ...formData, id_canal: val })}
                            placeholder="Buscar canal..."
                            labelKey="nome"
                            valueKey="id"
                            disabled={editMode}
                        />
                    </div>
                    <div className="form-group"><label>Título da Obra</label><input type="text" required value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label>Data de Publicação</label><input type="datetime-local" required value={formData.datah} onChange={e => setFormData({ ...formData, datah: e.target.value })} /></div>
                        <div className="form-group"><label>Duração (Min)</label><input type="number" required value={formData.duracao} onChange={e => setFormData({ ...formData, duracao: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Tema / Categoria</label><input type="text" value={formData.tema} onChange={e => setFormData({ ...formData, tema: e.target.value })} placeholder="Ex: Gaming, IRL..." /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label>Pico Simultâneo</label><input type="number" value={formData.visu_simul} onChange={e => setFormData({ ...formData, visu_simul: e.target.value })} /></div>
                        <div className="form-group"><label>Alcance Total</label><input type="number" value={formData.visu_total} onChange={e => setFormData({ ...formData, visu_total: e.target.value })} /></div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editMode ? "Salvar Alterações" : "Publicar Vídeo"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default VideosPage;
