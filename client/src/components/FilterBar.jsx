import { useState, useEffect } from 'react';
import { Filter, Calendar, Tv, Play, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const FilterBar = ({ onFilterChange }) => {
    const [channels, setChannels] = useState([]);
    const [videos, setVideos] = useState([]);
    const [filters, setFilters] = useState({
        channel_id: '',
        video_id: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetch('/api/channels').then(res => res.json()).then(data => setChannels(data.items || []));
    }, []);

    useEffect(() => {
        if (filters.channel_id) {
            // Fetch videos for this channel if needed, or just allow search
            fetch(`/api/videos?channel_id=${filters.channel_id}`).then(res => res.json()).then(data => setVideos(data.items || []));
        } else {
            setVideos([]);
            setFilters(f => ({ ...f, video_id: '' }));
        }
    }, [filters.channel_id]);

    const handleChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const reset = { channel_id: '', video_id: '', start_date: '', end_date: '' };
        setFilters(reset);
        onFilterChange(reset);
    };

    return (
        <div className="filter-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Filter size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Filtros DW</span>
            </div>

            <div style={{ width: '250px' }}>
                <SearchableSelect
                    options={channels}
                    value={filters.channel_id}
                    onChange={v => handleChange('channel_id', v)}
                    placeholder="Filtrar por Canal..."
                    labelKey="nome"
                    valueKey="id"
                />
            </div>

            <div style={{ width: '250px' }}>
                <SearchableSelect
                    options={videos}
                    value={filters.video_id}
                    onChange={v => handleChange('video_id', v)}
                    placeholder="Filtrar por Vídeo..."
                    labelKey="titulo"
                    valueKey="id_video"
                    disabled={!filters.channel_id}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <input
                    type="date"
                    value={filters.start_date}
                    onChange={e => handleChange('start_date', e.target.value)}
                    style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>até</span>
                <input
                    type="date"
                    value={filters.end_date}
                    onChange={e => handleChange('end_date', e.target.value)}
                    style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                />
            </div>

            <button className="btn btn-ghost" onClick={clearFilters} style={{ padding: '0.5rem', height: 'auto' }}>
                <X size={18} /> Limpar
            </button>
        </div>
    );
};

export default FilterBar;
