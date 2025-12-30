-- Seed Data for StreamerData One (Schema: system_antig)

-- 1. Conversão e Países
INSERT INTO system_antig.conversao (id, moeda, nome, fator_conver) VALUES
(1, 'USD', 'Dolar Americano', 1.0),
(2, 'BRL', 'Real Brasileiro', 0.20),
(3, 'EUR', 'Euro', 1.10);

INSERT INTO system_antig.pais (id, ddi, nome, id_conversao) VALUES
(1, '+55', 'Brasil', 2),
(2, '+1', 'EUA', 1),
(3, '+351', 'Portugal', 3);

-- 2. Empresas e Plataformas
INSERT INTO system_antig.empresa (nro, nome, nome_fantasia) VALUES
(100, 'TechCorp', 'Tech Global'),
(101, 'Nebula Games', 'Nebula'),
(102, 'StreamMaster', 'Stream Master Inc');

INSERT INTO system_antig.plataforma (nro, nome, empresa_fund, empresa_respo, data_fund) VALUES
(10, 'StreamTwist', 100, 100, '2010-01-01'),
(11, 'VisionTube', 101, 101, '2005-02-14');

-- 3. Usuários (Streamers e Viewers)
INSERT INTO system_antig.usuario (id, nick, email, data_nasc, telefone, end_postal, id_pais) VALUES
(1, 'Gaules_BR', 'gau@email.com', '1983-01-01', '1199999999', 'Rua A, SP', 1),
(2, 'Alanzoka_Gamer', 'alan@email.com', '1990-05-05', '1188888888', 'Rua B, SP', 1),
(3, 'ProPlayer_USA', 'pro@email.com', '1995-10-24', '123456789', 'Street C, NY', 2), 
(4, 'Viewer_Zezinho', 'ze@email.com', '2000-01-01', '99991111', 'Rua D', 1),
(5, 'Viewer_Maria', 'maria@email.com', '2001-01-01', '99992222', 'Rua E', 1),
(6, 'Rich_Donor', 'rich@email.com', '1985-01-01', '11112222', 'Av F, Miami', 2);

-- Relacionamento PlataformaUsuario
INSERT INTO system_antig.plataformaUsuario (nro_plataforma, id_usuario, nro_usuario) VALUES
(10, 1, 1001), (10, 2, 1002), (10, 4, 1003), (10, 5, 1004), (10, 6, 1005),
(11, 3, 2001), (11, 6, 2002);

-- 4. Canais
INSERT INTO system_antig.canal (id, nome, tipo, data, descricao, id_streamer, nro_plataforma) VALUES
(1, 'Tribo do Gaules', 'publico', '2015-01-01', 'A maior tribo do mundo', 1, 10),
(2, 'Canal do Alan', 'publico', '2014-01-01', 'Terror e Diversão', 2, 10),
(3, 'Pro Plays TV', 'misto', '2018-04-29', 'High level gameplay', 3, 11);

-- 5. Patrocínios
INSERT INTO system_antig.patrocinio (nro_empresa, id_canal, valor) VALUES
(100, 1, 15000.00), -- TechCorp investe pesado no Gaules
(101, 2, 8000.00),  -- Nebula investe no Alan
(102, 3, 12000.00); -- StreamMaster investe no ProPlayer

-- 6. Níveis de Canal e Inscrições
INSERT INTO system_antig.nivelCanal (id_canal, nivel, valor, gif) VALUES
(1, 'Membro da Tribo', 5.00, 'tribo.gif'),
(1, 'Capacete', 20.00, 'capacete.gif'),
(2, 'Alanlover', 4.00, 'alan.gif'),
(3, 'Elite Squad', 10.00, 'elite.gif');

INSERT INTO system_antig.inscricao (id_canal, id_membro, nivel) VALUES
(1, 4, 'Membro da Tribo'),
(1, 5, 'Capacete'),
(1, 6, 'Capacete'),
(2, 4, 'Alanlover'),
(3, 6, 'Elite Squad');

-- 7. Vídeos
INSERT INTO system_antig.video (id_video, id_canal, titulo, dataH, tema, duracao, visu_total) VALUES
(1, 1, 'Final do Major de CS', NOW() - INTERVAL '1 day', 'eSports', 300, 500000),
(2, 1, 'React do Jogo', NOW() - INTERVAL '2 days', 'React', 120, 150000),
(3, 2, 'Susto no Resident Evil', NOW() - INTERVAL '3 days', 'Terror', 240, 200000),
(4, 3, 'Highlights da Season', NOW() - INTERVAL '4 days', 'Gaming', 20, 1000000);

-- 8. Comentários
INSERT INTO system_antig.comentario (id_video, id_canal, id_usuario, seq, texto, dataH, coment_on) VALUES
(1, 1, 6, 1, 'Joga muito!', NOW(), true),
(3, 2, 6, 1, 'Que susto!', NOW(), true);

-- 9. Doações (Tabela Pai e Tabelas Filhas)
-- Doação 1: $100 no vídeo do Gaules (via Bitcoin)
INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status) 
VALUES (1, 1, 6, 1, 1, 100.00, 'lido');

INSERT INTO system_antig.bitCoin (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, TxID)
VALUES (1, 1, 6, 1, 1, 'tx_hash_abc_123');

-- Doação 2: $500 no vídeo do Gaules (via Cartão)
INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status) 
VALUES (1, 1, 6, 1, 2, 500.00, 'recebido');

INSERT INTO system_antig.cartaoCredito (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, nro, bandeira)
VALUES (1, 1, 6, 1, 2, '4555888899990000', 'Mastercard');

-- Doação 3: $50 no vídeo do Alan (via PayPal)
INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status) 
VALUES (3, 2, 6, 1, 1, 50.00, 'lido');

INSERT INTO system_antig.payPal (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, IdPayPal)
VALUES (3, 2, 6, 1, 1, 'paypal_id_xyz');

-- 10. Atualizar Views Materializadas
-- IMPORTANTE: Views materializadas precisam ser atualizadas explicitamente após inserts
REFRESH MATERIALIZED VIEW system_antig.mv_faturamento_canal;
REFRESH MATERIALIZED VIEW system_antig.mv_performance_streamers;
