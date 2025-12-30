import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ReceiptText, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';

const DonationsPage = () => {
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id_video: '', id_usuario: '', valor: '', status: 'recebido' });

    // Filtering and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchItems();
        fetchUsers();
        fetchVideos();
    }, [page, searchTerm]);

    const fetchItems = () => {
        setLoading(true);
        fetch(`/api/donations?q=${searchTerm}&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setItems(data.items);
                setTotal(data.total);
                setLoading(false);
            });
    };

    const fetchUsers = () => fetch('/api/users').then(res => res.json()).then(data => setUsers(data.items || data));
    const fetchVideos = () => fetch('/api/videos').then(res => res.json()).then(data => setVideos(data.items || data));

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ id_video: '', id_usuario: '', valor: '', status: 'recebido' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (i) => {
        setEditMode(true);
        setFormData({
            id_video: i.id_video,
            id_canal: i.id_canal,
            id_usuario: i.id_usuario,
            seq_comentario: i.seq_comentario,
            seq_pg: i.seq_pg,
            valor: i.valor,
            status: i.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const video = videos.find(v => String(v.id_video) === String(formData.id_video));
        if (!video) return;

        const url = editMode
            ? `/api/donations/${formData.id_video}/${formData.id_canal}/${formData.id_usuario}/${formData.seq_comentario}/${formData.seq_pg}`
            : '/api/donations';
        const method = editMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                id_video: parseInt(formData.id_video),
                id_canal: video.id_canal,
                id_usuario: parseInt(formData.id_usuario),
                valor: parseFloat(formData.valor)
            })
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchItems();
        }
    };

    const getStatusPill = (status) => {
        const styles = {
            lido: { bg: '#dcfce7', text: '#166534', icon: <CheckCircle2 size={12} /> },
            recebido: { bg: '#dbeafe', text: '#1e40af', icon: <Clock size={12} /> },
            recusado: { bg: '#fee2e2', text: '#991b1b', icon: <XCircle size={12} /> }
        };
        const s = styles[status] || styles.recebido;
        return (
            <div style={{ background: s.bg, color: s.text, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {s.icon} {status}
            </div>
        );
    };

    return (
        <div className="main-content">
            <section className="hero-section">
                <div className="action-bar">
                    <div>
                        <h2>Fluxo Financeiro</h2>
                        <p className="subtitle">Gestão de contribuições e doações em tempo real</p>
                    </div>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por doador ou vídeo..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} /> Nova Doação
                    </button>
                </div>
            </section>

            <div className="list-view">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vídeo Alvo</th>
                            <th>Doador</th>
                            <th>Valor (USD)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((i, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ReceiptText size={18} color="var(--text-muted)" />
                                        <span style={{ fontWeight: 600 }}>{i.video_titulo}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{i.nick}</td>
                                <td className="value-cell" style={{ fontSize: '1.1rem' }}>$ {(i.valor || 0).toLocaleString()}</td>
                                <td>{getStatusPill(i.status)}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', height: 'auto', padding: '0.4rem 0.8rem' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(i); }}>
                                            EDIT
                                        </button>
                                        <button className="btn btn-danger" style={{ height: 'auto', padding: '0.5rem' }} onClick={() => {
                                            if (confirm('Reverter doação?')) fetch(`/api/donations/${i.id_video}/${i.id_canal}/${i.id_usuario}/${i.seq_comentario}/${i.seq_pg}`, { method: 'DELETE' }).then(fetchItems);
                                        }}>
                                            <Trash2 size={18} />
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Editar Lançamento" : "Lançar Doação"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Conteúdo Associado</label>
                        <SearchableSelect
                            options={videos.map(v => ({ ...v, label: `${v.titulo} (${v.canal_nome})` }))}
                            value={formData.id_video}
                            onChange={(val) => setFormData({ ...formData, id_video: val })}
                            placeholder="Buscar vídeo por título ou canal..."
                            labelKey="label"
                            valueKey="id_video"
                            disabled={editMode}
                        />
                    </div>
                    <div className="form-group">
                        <label>Usuário Integrante</label>
                        <SearchableSelect
                            options={users}
                            value={formData.id_usuario}
                            onChange={(val) => setFormData({ ...formData, id_usuario: val })}
                            placeholder="Selecionar doador..."
                            labelKey="nick"
                            valueKey="id"
                            disabled={editMode}
                        />
                    </div>
                    <div className="form-group">
                        <label>Montante da Doação (USD)</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>$</div>
                            <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} style={{ paddingLeft: '2rem' }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status Inicial</label>
                        <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="recebido">Aguardando Validação (Recebido)</option>
                            <option value="lido">Processado e Exibido (Lido)</option>
                            <option value="recusado">Transação Recusada</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editMode ? "Salvar Alterações" : "Registrar Aporte"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DonationsPage;
