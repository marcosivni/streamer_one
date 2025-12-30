import psycopg2
from psycopg2.extras import execute_values
import os
import random
from faker import Faker
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

fake = Faker()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "system_antig"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        port=os.getenv("DB_PORT", "5432")
    )

def populate_data():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Add extra users (Streamers)
    print("Generating Streamers...")
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM system_antig.usuario")
    max_user_id = cur.fetchone()[0]
    
    users = []
    for i in range(1, 41): 
        users.append((
            max_user_id + i,
            f"{fake.user_name()[:40]}_{random.randint(1000,9999)}", 
            f"{random.randint(100,999)}_{fake.email()}",
            fake.date_of_birth(minimum_age=18, maximum_age=45).strftime('%Y-%m-%d'),
            fake.phone_number()[:20],
            fake.zipcode(),
            random.randint(1, 3)
        ))
    
    execute_values(cur, "INSERT INTO system_antig.usuario (id, nick, email, data_nasc, telefone, end_postal, id_pais) VALUES %s", users)
    
    # 2. Add extra channels
    print("Generating Channels...")
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM system_antig.canal")
    max_canal_id = cur.fetchone()[0]
    
    cur.execute("SELECT nro FROM system_antig.plataforma")
    platform_nros = [r[0] for r in cur.fetchall()]
    
    channels = []
    for i in range(1, 21): 
        channels.append((
            max_canal_id + i,
            f"{fake.company()[:40]} Stream",
            random.choice(['publico', 'privado', 'misto']),
            fake.date_this_decade().strftime('%Y-%m-%d'),
            fake.sentence(),
            max_user_id + i, # Assign to new users
            random.choice(platform_nros)
        ))
    
    execute_values(cur, "INSERT INTO system_antig.canal (id, nome, tipo, data, descricao, id_streamer, nro_plataforma) VALUES %s", channels)
    
    # 3. Add MUCH more data: Videos, Comments, Donations
    print("Generating Videos, Comments and Donations...")
    cur.execute("SELECT id FROM system_antig.canal")
    all_channel_ids = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id FROM system_antig.usuario")
    all_user_ids = [r[0] for r in cur.fetchall()]
    
    video_id_counter = {} 
    for cid in all_channel_ids:
        cur.execute("SELECT COALESCE(MAX(id_video), 0) FROM system_antig.video WHERE id_canal = %s", (cid,))
        video_id_counter[cid] = cur.fetchone()[0]

    batch_size = 500
    for round_num in range(2): # Double the effort
        print(f"Round {round_num + 1}...")
        videos = []
        comments = []
        donations = []
        
        for _ in range(batch_size):
            cid = random.choice(all_channel_ids)
            video_id_counter[cid] += 1
            vid = video_id_counter[cid]
            
            v_date = fake.date_time_between(start_date='-2y', end_date='now')
            videos.append((
                vid,
                cid,
                fake.catch_phrase()[:100],
                v_date.strftime('%Y-%m-%d %H:%M:%S'),
                random.choice(['Gaming', 'Just Chatting', 'ASMR', 'Programming', 'Cooking', 'Music']),
                random.randint(15, 300),
                random.randint(50, 10000),
                random.randint(1000, 500000)
            ))
            
            # Generate comments for each video (donations require comments)
            for seq in range(1, random.randint(5, 20)):
                uid = random.choice(all_user_ids)
                c_date = v_date + timedelta(minutes=random.randint(1, 120))
                comments.append((
                    vid,
                    cid,
                    uid,
                    seq,
                    fake.text(max_nb_chars=100),
                    c_date.strftime('%Y-%m-%d %H:%M:%S'),
                    True
                ))
                
                # Each comment has a 30% chance of being a donation
                if random.random() < 0.3:
                    donations.append((
                        vid,
                        cid,
                        uid,
                        seq,
                        random.randint(1, 1000000), # seq_pg
                        round(random.uniform(1, 1000), 2),
                        random.choice(['lido', 'recebido', 'recusado'])
                    ))

        execute_values(cur, "INSERT INTO system_antig.video (id_video, id_canal, titulo, datah, tema, duracao, visu_simul, visu_total) VALUES %s", videos)
        execute_values(cur, "INSERT INTO system_antig.comentario (id_video, id_canal, id_usuario, seq, texto, datah, coment_on) VALUES %s", comments)
        execute_values(cur, "INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status) VALUES %s", donations)
        print(f"Inserted {len(videos)} videos, {len(comments)} comments, and {len(donations)} donations.")
        conn.commit()

    # 4. Generate Subscriptions (Inscricoes)
    print("Generating Subscription Levels and Memberships...")
    # First, ensure some levels exist for all channels
    cur.execute("SELECT id FROM system_antig.canal")
    channel_ids = [r[0] for r in cur.fetchall()]
    
    levels = []
    for cid in channel_ids:
        levels.append((cid, 'Bronze', 5.00, 'bronze.gif'))
        levels.append((cid, 'Silver', 15.00, 'silver.gif'))
        levels.append((cid, 'Gold', 50.00, 'gold.gif'))
    
    execute_values(cur, "INSERT INTO system_antig.nivelcanal (id_canal, nivel, valor, gif) VALUES %s ON CONFLICT DO NOTHING", levels)
    
    subscriptions = []
    for _ in range(300): # 300 random subscriptions
        uid = random.choice(all_user_ids)
        cid = random.choice(channel_ids)
        subscriptions.append((
            cid,
            uid,
            random.choice(['Bronze', 'Silver', 'Gold'])
        ))
    
    execute_values(cur, "INSERT INTO system_antig.inscricao (id_canal, id_membro, nivel) VALUES %s ON CONFLICT DO NOTHING", subscriptions)
    conn.commit()

    cur.close()
    conn.close()
    print("Database population complete!")

if __name__ == "__main__":
    populate_data()
