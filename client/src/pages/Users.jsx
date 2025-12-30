import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Trash2, Eye, Save, X, Mail, Phone, Calendar, Search } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';

const UsersPage = () => {
    const [items, setItems] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ nick: '', email: '', data_nasc: '', telefone: '', end_postal: '', id_pais: '' });

    // Filtering and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchItems();
        fetchCountries();
    }, [page, searchTerm]);

    const fetchItems = () => {
        setLoading(true);
        fetch(`/api/users?q=${searchTerm}&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setItems(data.items);
                setTotal(data.total);
                setLoading(false);
            });
    };

    const fetchCountries = () => {
        fetch('/api/countries').then(res => res.json()).then(data => setCountries(data));
    };

    const fetchDetail = (id) => {
        fetch(`/api/users/${id}`).then(res => res.json()).then(data => setSelected(data));
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        setFormData({ nick: '', email: '', data_nasc: '', telefone: '', end_postal: '', id_pais: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditMode(true);
        setFormData({
            id: item.id,
            nick: item.nick,
            email: item.email,
            data_nasc: item.data_nasc.split('T')[0],
            telefone: item.telefone,
            end_postal: item.end_postal,
            id_pais: item.id_pais
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editMode ? `/api/users/${formData.id}` : '/api/users';
        const method = editMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, id_pais: parseInt(formData.id_pais) })
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
                        <h2>Usuários</h2>
                        <p className="subtitle">Gestão global de perfis e acessos</p>
                    </div>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nick ou email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 450px' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
                <div className="list-view">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Telefone</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => fetchDetail(i.id)}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{i.nick}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.email}</span>
                                        </div>
                                    </td>
                                    <td>{i.telefone}</td>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 48, height: 48, background: 'var(--brand)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                    {selected.nick[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{selected.nick}</h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Membro ID #{selected.id}</span>
                                </div>
                            </div>
                            <button className="btn" style={{ height: 'auto', padding: '4px' }} onClick={() => setSelected(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={16} color="var(--text-muted)" /> <span style={{ color: 'var(--text-secondary)' }}>{selected.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Phone size={16} color="var(--text-muted)" /> <span style={{ color: 'var(--text-secondary)' }}>{selected.telefone}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calendar size={16} color="var(--text-muted)" /> <span style={{ color: 'var(--text-secondary)' }}>{new Date(selected.data_nasc).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem' }}>
                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Atividades Ativas</label>
                            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                                <div style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Canais</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selected.channels?.length || 0}</div>
                                </div>
                                <div style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doações Realizadas</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selected.donations?.length || 0}</div>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '3rem' }} onClick={() => {
                            if (confirm('Excluir usuário?')) fetch(`/api/users/${selected.id}`, { method: 'DELETE' }).then(() => { fetchItems(); setSelected(null); });
                        }}>
                            <Trash2 size={18} /> Excluir Conta Permanetemente
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Editar Usuário" : "Novo Usuário"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nickname</label><input type="text" required value={formData.nick} onChange={e => setFormData({ ...formData, nick: e.target.value })} placeholder="Ex: streamer123" /></div>
                    <div className="form-group"><label>Email Address</label><input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label>Telefone</label><input type="text" required value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" required value={formData.data_nasc} onChange={e => setFormData({ ...formData, data_nasc: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Postal Address</label><textarea required value={formData.end_postal} onChange={e => setFormData({ ...formData, end_postal: e.target.value })} style={{ minHeight: '80px' }} /></div>
                    <div className="form-group">
                        <label>Nacionalidade</label>
                        <SearchableSelect
                            options={countries}
                            value={formData.id_pais}
                            onChange={(val) => setFormData({ ...formData, id_pais: val })}
                            placeholder="Selecionar país..."
                            valueKey="id"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {editMode ? "Salvar Alterações" : "Confirmar Cadastro"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersPage;
