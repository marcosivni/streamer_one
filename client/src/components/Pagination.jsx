import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ total, page, limit, onPageChange }) => {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className="pagination">
            <div className="pagination-info">
                Mostrando {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} de {total} registros
            </div>
            <div className="pagination-controls">
                <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft size={16} />
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        className={`page-btn ${page === p ? 'active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
