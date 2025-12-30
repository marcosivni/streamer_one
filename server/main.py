from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
from datetime import date, datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StreamerData One API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

# --- Pydantic Models ---

class Platform(BaseModel):
    nro: Optional[int] = None
    nome: str
    empresa_fund: int
    empresa_respo: int
    data_fund: str
    qtd_users: Optional[int] = 0

class User(BaseModel):
    id: Optional[int] = None
    nick: str
    email: str
    data_nasc: str
    telefone: str
    end_postal: str
    id_pais: int

class Channel(BaseModel):
    id: Optional[int] = None
    nome: str
    tipo: str
    data: str
    descricao: Optional[str] = None
    id_streamer: int
    nro_plataforma: int
    qtd_visualizacoes: Optional[int] = 0

class Video(BaseModel):
    id_video: Optional[int] = None
    id_canal: int
    titulo: str
    datah: str
    tema: Optional[str] = None
    duracao: int
    visu_simul: Optional[int] = 0
    visu_total: Optional[int] = 0

class Donation(BaseModel):
    id_video: int
    id_canal: int
    id_usuario: int
    seq_comentario: Optional[int] = None
    seq_pg: Optional[int] = None
    valor: float
    status: str

# --- Helper for Queries ---

def execute_query(query: str, params: tuple = None, fetch_all: bool = True):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, params)
        if fetch_all:
            result = cur.fetchall()
        else:
            result = cur.fetchone()
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# --- Routes ---

@app.get("/")
@app.get("/api/")
def read_root():
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"message": "StreamerData Backend v1.1", "db_status": "connected"}
    return {"message": "StreamerData Backend v1.1", "db_status": "disconnected"}

# Ranking Routes (Keep existing functionality)

@app.get("/api/ranking/faturamento")
def get_ranking_faturamento(limit: int = 10, channel_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    # The function f_ranking_faturamento_total doesn't natively support these filters, 
    # so we'll wrap it or use a custom query if filters are present.
    if not any([channel_id, start_date, end_date]):
        return execute_query("SELECT rank_faturamento as rank, id_canal, nome_canal, faturamento_total as faturamento FROM system_antig.f_ranking_faturamento_total(%s)", (limit,))
    
    where_clauses = []
    params = []
    if channel_id:
        where_clauses.append("d.id_canal = %s")
        params.append(channel_id)
    if start_date:
        where_clauses.append("c.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("c.datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    query = f"""
        SELECT 
            DENSE_RANK() OVER (ORDER BY SUM(d.valor) DESC) as rank,
            d.id_canal,
            can.nome as nome_canal,
            SUM(d.valor) as faturamento
        FROM system_antig.doacao d
        JOIN system_antig.canal can ON d.id_canal = can.id
        JOIN system_antig.comentario c ON d.id_video = c.id_video AND d.id_canal = c.id_canal AND d.id_usuario = c.id_usuario AND d.seq_comentario = c.seq
        {where_str}
        GROUP BY d.id_canal, can.nome
        ORDER BY faturamento DESC
        LIMIT %s
    """
    params.append(limit)
    return execute_query(query, tuple(params))

@app.get("/api/ranking/videos-virais")
def get_videos_virais(limit: int = 10, channel_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    where_clauses = []
    params = []
    if channel_id:
        where_clauses.append("v.id_canal = %s")
        params.append(channel_id)
    if start_date:
        where_clauses.append("v.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("v.datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    query = f"""
        SELECT 
            vv.* 
        FROM system_antig.v_videos_virais vv
        JOIN system_antig.video v ON vv.id_video = v.id_video AND vv.id_canal = v.id_canal
        {where_str} 
        ORDER BY vv.taxa_engajamento DESC 
        LIMIT %s
    """
    params.append(limit)
    return execute_query(query, tuple(params))

@app.get("/api/ranking/streamers")
def get_top_streamers(limit: int = 10, start_date: Optional[str] = None, end_date: Optional[str] = None):
    if not (start_date or end_date):
        return execute_query("SELECT nick, qtd_canais as canais, total_videos_postados as videos, audiencia_total_acumulada as audiencia FROM system_antig.mv_performance_streamers ORDER BY audiencia DESC LIMIT %s", (limit,))
    
    where_clauses = []
    params = []
    if start_date:
        where_clauses.append("v.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("v.datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    query = f"""
        SELECT 
            u.nick,
            COUNT(DISTINCT c.id) as canais,
            COUNT(DISTINCT v.id_video) as videos,
            SUM(v.visu_total) as audiencia
        FROM system_antig.usuario u
        JOIN system_antig.canal c ON u.id = c.id_streamer
        JOIN system_antig.video v ON c.id = v.id_canal
        {where_str}
        GROUP BY u.id, u.nick
        ORDER BY audiencia DESC
        LIMIT %s
    """
    params.append(limit)
    return execute_query(query, tuple(params))

@app.get("/api/ranking/top-viewers")
def get_top_viewers(limit: int = 10, channel_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    where_clauses = []
    params = []
    if channel_id:
        where_clauses.append("d.id_canal = %s")
        params.append(channel_id)
    if start_date:
        where_clauses.append("c.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("c.datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    query = f"""
        SELECT 
            u.nick,
            COUNT(DISTINCT d.id_video) as videos_apoiados,
            SUM(d.valor) as total_doado
        FROM system_antig.usuario u
        JOIN system_antig.doacao d ON u.id = d.id_usuario
        LEFT JOIN system_antig.comentario c ON d.id_video = c.id_video AND d.id_canal = c.id_canal AND d.id_usuario = c.id_usuario AND d.seq_comentario = c.seq
        {where_str}
        GROUP BY u.id, u.nick
        ORDER BY total_doado DESC
        LIMIT %s
    """
    params.append(limit)
    return execute_query(query, tuple(params))

# --- CRUD for Platforms ---

@app.get("/api/platforms")
def list_platforms(q: Optional[str] = None, page: int = 1):
    limit = 10
    offset = (page - 1) * limit
    where_clause = ""
    params = []
    if q:
        where_clause = "WHERE nome ILIKE %s"
        params.append(f"%{q}%")
    
    total = execute_query(f"SELECT COUNT(*) as count FROM system_antig.plataforma {where_clause}", tuple(params), fetch_all=False)["count"]
    
    query = f"SELECT * FROM system_antig.plataforma {where_clause} ORDER BY nro LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    items = execute_query(query, tuple(params))
    
    return {"items": items, "total": total, "page": page, "limit": limit}

@app.get("/api/platforms/{nro}")
def get_platform(nro: int):
    platform = execute_query("SELECT * FROM system_antig.plataforma WHERE nro = %s", (nro,), fetch_all=False)
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    # Follow FKs: Channels in this platform
    channels = execute_query("SELECT * FROM system_antig.canal WHERE nro_plataforma = %s", (nro,))
    platform["channels"] = channels
    return platform

@app.post("/api/platforms")
def create_platform(p: Platform):
    next_nro = execute_query("SELECT COALESCE(MAX(nro), 0) + 1 as next_id FROM system_antig.plataforma", fetch_all=False)["next_id"]
    execute_query("INSERT INTO system_antig.plataforma (nro, nome, empresa_fund, empresa_respo, data_fund) VALUES (%s, %s, %s, %s, %s)", 
                  (next_nro, p.nome, p.empresa_fund, p.empresa_respo, p.data_fund), fetch_all=False)
    return {"status": "success", "id": next_nro}

@app.put("/api/platforms/{nro}")
def update_platform(nro: int, p: Platform):
    execute_query("UPDATE system_antig.plataforma SET nome=%s, empresa_fund=%s, empresa_respo=%s, data_fund=%s WHERE nro=%s", 
                  (p.nome, p.empresa_fund, p.empresa_respo, p.data_fund, nro), fetch_all=False)
    return {"status": "success"}

@app.delete("/api/platforms/{nro}")
def delete_platform(nro: int):
    execute_query("DELETE FROM system_antig.plataforma WHERE nro=%s", (nro,), fetch_all=False)
    return {"status": "success"}

# --- CRUD for Users ---

@app.get("/api/users")
def list_users(q: Optional[str] = None, page: int = 1):
    limit = 10
    offset = (page - 1) * limit
    where_clause = ""
    params = []
    if q:
        where_clause = "WHERE nick ILIKE %s OR email ILIKE %s"
        params.extend([f"%{q}%", f"%{q}%"])
    
    total = execute_query(f"SELECT COUNT(*) as count FROM system_antig.usuario {where_clause}", tuple(params), fetch_all=False)["count"]
    
    query = f"SELECT * FROM system_antig.usuario {where_clause} ORDER BY id LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    items = execute_query(query, tuple(params))
    
    return {"items": items, "total": total, "page": page, "limit": limit}

@app.get("/api/users/{id}")
def get_user(id: int):
    user = execute_query("SELECT * FROM system_antig.usuario WHERE id = %s", (id,), fetch_all=False)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Follow FKs: Channels owned by this user
    channels = execute_query("SELECT * FROM system_antig.canal WHERE id_streamer = %s", (id,))
    # Donations made by this user
    donations = execute_query("SELECT * FROM system_antig.doacao WHERE id_usuario = %s LIMIT 10", (id,))
    user["channels"] = channels
    user["donations"] = donations
    return user

@app.post("/api/users")
def create_user(u: User):
    next_id = execute_query("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM system_antig.usuario", fetch_all=False)["next_id"]
    execute_query("INSERT INTO system_antig.usuario (id, nick, email, data_nasc, telefone, end_postal, id_pais) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                  (next_id, u.nick, u.email, u.data_nasc, u.telefone, u.end_postal, u.id_pais), fetch_all=False)
    return {"status": "success", "id": next_id}

@app.put("/api/users/{id}")
def update_user(id: int, u: User):
    execute_query("UPDATE system_antig.usuario SET nick=%s, email=%s, data_nasc=%s, telefone=%s, end_postal=%s, id_pais=%s WHERE id=%s", 
                  (u.nick, u.email, u.data_nasc, u.telefone, u.end_postal, u.id_pais, id), fetch_all=False)
    return {"status": "success"}

@app.delete("/api/users/{id}")
def delete_user(id: int):
    execute_query("DELETE FROM system_antig.usuario WHERE id=%s", (id,), fetch_all=False)
    return {"status": "success"}

# --- CRUD for Channels (Streamers) ---

@app.get("/api/channels")
def list_channels(q: Optional[str] = None, page: int = 1):
    limit = 10
    offset = (page - 1) * limit
    where_clause = ""
    params = []
    if q:
        where_clause = "WHERE c.nome ILIKE %s"
        params.append(f"%{q}%")
    
    total = execute_query(f"SELECT COUNT(*) as count FROM system_antig.canal c {where_clause}", tuple(params), fetch_all=False)["count"]
    
    query = f"SELECT c.*, u.nick as streamer_nick, p.nome as platform_name FROM system_antig.canal c JOIN system_antig.usuario u ON c.id_streamer = u.id JOIN system_antig.plataforma p ON c.nro_plataforma = p.nro {where_clause} ORDER BY c.id LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    items = execute_query(query, tuple(params))
    
    return {"items": items, "total": total, "page": page, "limit": limit}

@app.get("/api/channels/{id}")
def get_channel(id: int):
    channel = execute_query("SELECT c.*, u.nick as streamer_nick, p.nome as platform_name FROM system_antig.canal c JOIN system_antig.usuario u ON c.id_streamer = u.id JOIN system_antig.plataforma p ON c.nro_plataforma = p.nro WHERE c.id = %s", (id,), fetch_all=False)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    # Videos in this channel
    videos = execute_query("SELECT * FROM system_antig.video WHERE id_canal = %s ORDER BY datah DESC", (id,))
    channel["videos"] = videos
    return channel

@app.post("/api/channels")
def create_channel(c: Channel):
    next_id = execute_query("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM system_antig.canal", fetch_all=False)["next_id"]
    execute_query("INSERT INTO system_antig.canal (id, nome, tipo, data, descricao, id_streamer, nro_plataforma) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                  (next_id, c.nome, c.tipo, c.data, c.descricao, c.id_streamer, c.nro_plataforma), fetch_all=False)
    return {"status": "success", "id": next_id}

@app.put("/api/channels/{id}")
def update_channel(id: int, c: Channel):
    execute_query("UPDATE system_antig.canal SET nome=%s, tipo=%s, data=%s, descricao=%s, id_streamer=%s, nro_plataforma=%s WHERE id=%s", 
                  (c.nome, c.tipo, c.data, c.descricao, c.id_streamer, c.nro_plataforma, id), fetch_all=False)
    return {"status": "success"}

@app.delete("/api/channels/{id}")
def delete_channel(id: int):
    execute_query("DELETE FROM system_antig.canal WHERE id=%s", (id,), fetch_all=False)
    return {"status": "success"}

# --- CRUD for Videos ---

@app.get("/api/videos")
def list_videos(q: Optional[str] = None, channel_id: Optional[int] = None, page: int = 1):
    limit = 10
    offset = (page - 1) * limit
    where_clauses = []
    params = []
    if q:
        where_clauses.append("v.titulo ILIKE %s")
        params.append(f"%{q}%")
    if channel_id:
        where_clauses.append("v.id_canal = %s")
        params.append(channel_id)
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    total = execute_query(f"SELECT COUNT(*) as count FROM system_antig.video v {where_str}", tuple(params), fetch_all=False)["count"]
    
    query = f"SELECT v.*, c.nome as canal_nome FROM system_antig.video v JOIN system_antig.canal c ON v.id_canal = c.id {where_str} ORDER BY v.datah DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    items = execute_query(query, tuple(params))
    
    return {"items": items, "total": total, "page": page, "limit": limit}

@app.get("/api/videos/{id_canal}/{id_video}")
def get_video(id_canal: int, id_video: int):
    video = execute_query("SELECT v.*, c.nome as canal_nome FROM system_antig.video v JOIN system_antig.canal c ON v.id_canal = c.id WHERE v.id_video = %s AND v.id_canal = %s", (id_video, id_canal), fetch_all=False)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    # Donations for this video
    donations = execute_query("SELECT d.*, u.nick FROM system_antig.doacao d JOIN system_antig.usuario u ON d.id_usuario = u.id WHERE d.id_video = %s AND d.id_canal = %s", (id_video, id_canal))
    video["donations"] = donations
    return video

@app.post("/api/videos")
def create_video(v: Video):
    next_id = execute_query("SELECT COALESCE(MAX(id_video), 0) + 1 as next_id FROM system_antig.video WHERE id_canal = %s", (v.id_canal,), fetch_all=False)["next_id"]
    execute_query("INSERT INTO system_antig.video (id_video, id_canal, titulo, datah, tema, duracao, visu_simul, visu_total) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                  (next_id, v.id_canal, v.titulo, v.datah, v.tema, v.duracao, v.visu_simul, v.visu_total), fetch_all=False)
    return {"status": "success", "id": next_id}

@app.put("/api/videos/{id_canal}/{id_video}")
def update_video(id_canal: int, id_video: int, v: Video):
    execute_query("UPDATE system_antig.video SET titulo=%s, datah=%s, tema=%s, duracao=%s, visu_simul=%s, visu_total=%s WHERE id_video=%s AND id_canal=%s", 
                  (v.titulo, v.datah, v.tema, v.duracao, v.visu_simul, v.visu_total, id_video, id_canal), fetch_all=False)
    return {"status": "success"}

@app.delete("/api/videos/{id_canal}/{id_video}")
def delete_video(id_canal: int, id_video: int):
    execute_query("DELETE FROM system_antig.video WHERE id_video=%s AND id_canal=%s", (id_video, id_canal), fetch_all=False)
    return {"status": "success"}

# --- CRUD for Donations ---

@app.get("/api/donations")
def list_donations(q: Optional[str] = None, page: int = 1):
    limit = 10
    offset = (page - 1) * limit
    where_clause = ""
    params = []
    if q:
        where_clause = "WHERE u.nick ILIKE %s OR v.titulo ILIKE %s"
        params.extend([f"%{q}%", f"%{q}%"])
    
    total = execute_query(f"SELECT COUNT(*) as count FROM system_antig.doacao d JOIN system_antig.usuario u ON d.id_usuario = u.id JOIN system_antig.video v ON d.id_video = v.id_video AND d.id_canal = v.id_canal {where_clause}", tuple(params), fetch_all=False)["count"]
    
    query = f"SELECT d.*, u.nick, v.titulo as video_titulo FROM system_antig.doacao d JOIN system_antig.usuario u ON d.id_usuario = u.id JOIN system_antig.video v ON d.id_video = v.id_video AND d.id_canal = v.id_canal {where_clause} ORDER BY d.valor DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    items = execute_query(query, tuple(params))
    
    return {"items": items, "total": total, "page": page, "limit": limit}

@app.post("/api/donations")
def create_donation(d: Donation):
    seq_c = d.seq_comentario or random.randint(1, 1000000)
    seq_p = d.seq_pg or random.randint(1, 1000000)
    execute_query("INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                  (d.id_video, d.id_canal, d.id_usuario, seq_c, seq_p, d.valor, d.status), fetch_all=False)
    return {"status": "success"}

@app.put("/api/donations/{id_video}/{id_canal}/{id_usuario}/{seq_comentario}/{seq_pg}")
def update_donation(id_video: int, id_canal: int, id_usuario: int, seq_comentario: int, seq_pg: int, d: Donation):
    execute_query("UPDATE system_antig.doacao SET valor=%s, status=%s WHERE id_video=%s AND id_canal=%s AND id_usuario=%s AND seq_comentario=%s AND seq_pg=%s", 
                  (d.valor, d.status, id_video, id_canal, id_usuario, seq_comentario, seq_pg), fetch_all=False)
    return {"status": "success"}

@app.delete("/api/donations/{id_video}/{id_canal}/{id_usuario}/{seq_comentario}/{seq_pg}")
def delete_donation(id_video: int, id_canal: int, id_usuario: int, seq_comentario: int, seq_pg: int):
    execute_query("DELETE FROM system_antig.doacao WHERE id_video=%s AND id_canal=%s AND id_usuario=%s AND seq_comentario=%s AND seq_pg=%s", 
                  (id_video, id_canal, id_usuario, seq_comentario, seq_pg), fetch_all=False)
    return {"status": "success"}

# --- Analytical Endpoints ---

@app.get("/api/reports/revenue-over-time")
def get_revenue_over_time(channel_id: Optional[int] = None, video_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    where_clauses = ["d.status IN ('lido', 'recebido')"]
    params = []
    if channel_id:
        where_clauses.append("d.id_canal = %s")
        params.append(channel_id)
    if video_id:
        where_clauses.append("d.id_video = %s")
        params.append(video_id)
    if start_date:
        where_clauses.append("c.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("c.datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses)
    
    return execute_query(f"""
        SELECT 
            TO_CHAR(c.datah, 'YYYY-MM') as month,
            SUM(d.valor) as total
        FROM system_antig.doacao d
        JOIN system_antig.comentario c ON d.id_video = c.id_video AND d.id_canal = c.id_canal AND d.id_usuario = c.id_usuario AND d.seq_comentario = c.seq
        {where_str}
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
    """, tuple(params))

@app.get("/api/reports/distribution-by-theme")
def get_distribution_by_theme(channel_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    where_clauses = ["tema IS NOT NULL"]
    params = []
    if channel_id:
        where_clauses.append("id_canal = %s")
        params.append(channel_id)
    if start_date:
        where_clauses.append("datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("datah <= %s")
        params.append(end_date)
    
    where_str = "WHERE " + " AND ".join(where_clauses)
    
    return execute_query(f"""
        SELECT 
            tema, 
            COUNT(*) as count,
            SUM(visu_total) as total_views
        FROM system_antig.video
        {where_str}
        GROUP BY tema
        ORDER BY count DESC
    """, tuple(params))

@app.get("/api/reports/drilldown-performance")
def get_drilldown_performance(channel_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    # If no channel selected: Aggregate by Channels
    # If channel selected: Aggregate by Videos
    
    where_clauses = []
    params = []
    if start_date:
        where_clauses.append("v.datah >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("v.datah <= %s")
        params.append(end_date)
        
    if not channel_id:
        where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        return execute_query(f"""
            SELECT 
                c.nome as entity_name,
                COUNT(v.id_video) as total_items,
                SUM(v.visu_total) as total_views,
                COALESCE(SUM(d.valor), 0) as total_revenue
            FROM system_antig.canal c
            LEFT JOIN system_antig.video v ON c.id = v.id_canal
            LEFT JOIN system_antig.doacao d ON v.id_video = d.id_video AND v.id_canal = d.id_canal
            {where_str}
            GROUP BY c.id, c.nome
            ORDER BY total_revenue DESC
        """, tuple(params))
    else:
        where_clauses.append("v.id_canal = %s")
        params.append(channel_id)
        where_str = "WHERE " + " AND ".join(where_clauses)
        return execute_query(f"""
            SELECT 
                v.titulo as entity_name,
                v.visu_total as total_views,
                v.visu_simul as peak_views,
                COALESCE(SUM(d.valor), 0) as total_revenue
            FROM system_antig.video v
            LEFT JOIN system_antig.doacao d ON v.id_video = d.id_video AND v.id_canal = d.id_canal
            {where_str}
            GROUP BY v.id_video, v.id_canal, v.titulo, v.visu_total, v.visu_simul
            ORDER BY total_revenue DESC
        """, tuple(params))

@app.post("/api/reports/refresh")
def refresh_views():
    execute_query("CALL system_antig.sp_refresh_views_analiticas();", fetch_all=False)
    return {"status": "success", "message": "Analytical views refreshed"}

# --- Lookups ---

@app.get("/api/companies")
def list_companies():
    return execute_query("SELECT nro, nome FROM system_antig.empresa ORDER BY nome")

@app.get("/api/countries")
def list_countries():
    return execute_query("SELECT id, nome FROM system_antig.pais ORDER BY nome")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
