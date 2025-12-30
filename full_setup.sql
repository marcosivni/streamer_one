CREATE SCHEMA system_antig;
CREATE TABLE system_antig.empresa (
    nro INTEGER NOT NULL, -- PK
    nome VARCHAR(128) NOT NULL, -- Nome da empresa, obrigatório
    nome_fantasia VARCHAR(100), -- Nome fantasia
    PRIMARY KEY (nro)
);

CREATE TABLE system_antig.plataforma (
    nro INTEGER NOT NULL, -- PK
    nome VARCHAR(50) NOT NULL, -- Nome da plataforma
    empresa_fund INT NOT NULL, -- FK para Empresa (fundadora)
    empresa_respo INT NOT NULL, -- FK para Empresa (responsável)
    data_fund DATE NOT NULL, -- Data de fundacão
    qtd_users INTEGER DEFAULT 0, --Atributo derivado tratado com trigger
    PRIMARY KEY (nro),
    UNIQUE (nome),
    FOREIGN KEY (empresa_fund) REFERENCES system_antig.Empresa(nro)
        ON UPDATE CASCADE,
    FOREIGN KEY (empresa_respo) REFERENCES system_antig.Empresa(nro)
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.conversao (
    id INTEGER NOT NULL, -- PK, ID Artificial
    moeda CHAR(3) NOT NULL, -- Código ISO (ex: USD)
    nome VARCHAR(50) NOT NULL,
    fator_conver FLOAT NOT NULL, -- Fator de conversão para dólar
    PRIMARY KEY (id),
    UNIQUE (moeda)
);

CREATE TABLE system_antig.pais (
    id INTEGER NOT NULL, -- PK, ID Artificial
    ddi VARCHAR(5) NOT NULL, -- DDI (ex: +55), agora uma chave candidata
    nome VARCHAR(50) NOT NULL,
    id_conversao INT NOT NULL, -- FK para o ID artificial da tabela Conversao
    PRIMARY KEY (id),
    UNIQUE (ddi),
    UNIQUE (nome),
    FOREIGN KEY (id_conversao) REFERENCES system_antig.Conversao(id)
        ON DELETE RESTRICT -- Não se deve remover uma conversão se um país a estiver usando
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.usuario (
    id INTEGER NOT NULL, -- PK, ID Artificial sequencial (INTEGER)
    nick VARCHAR(50) NOT NULL, -- Nome de usuário/nick, único
    email VARCHAR(255) NOT NULL, -- Endereço de email, único
    data_nasc DATE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    end_postal TEXT NOT NULL,
    id_pais INT NOT NULL, -- FK para o ID artificial da tabela Pais
    PRIMARY KEY (id),
    UNIQUE (nick),
    UNIQUE (email),
    UNIQUE (telefone),
    FOREIGN KEY (id_pais) REFERENCES system_antig.Pais(id)
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.plataformaUsuario (
    nro_plataforma INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,  -- FK para Usuario(ID)
    nro_usuario INTEGER NOT NULL, -- O número do usuário específico naquela plataforma
    PRIMARY KEY (nro_plataforma, id_usuario),
    UNIQUE (nro_plataforma, nro_usuario),
    FOREIGN KEY (nro_plataforma) REFERENCES system_antig.Plataforma(nro)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES system_antig.Usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.streamerPais (
    id_streamer INTEGER NOT NULL, -- FK para Usuario(ID)
    id_pais INTEGER NOT NULL,     -- FK para Pais(ID)
    nro_passaporte VARCHAR(30), -- Número de passaporte
    PRIMARY KEY (id_streamer, id_pais),
    UNIQUE (nro_passaporte),
    FOREIGN KEY (id_streamer) REFERENCES system_antig.Usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_pais) REFERENCES system_antig.Pais(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.empresaPais (
    nro_empresa INTEGER NOT NULL,
    id_pais INTEGER NOT NULL,     -- FK para Pais(ID)
    id_nacional INTEGER NOT NULL,
    PRIMARY KEY (nro_empresa, id_pais),
    UNIQUE (id_pais,id_nacional), -- O identificador nacional é único dentro de um país
    FOREIGN KEY (nro_empresa) REFERENCES system_antig.Empresa(nro)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_pais) REFERENCES system_antig.Pais(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TYPE system_antig.tipo_canal_enum AS ENUM('privado', 'publico', 'misto');
CREATE TABLE system_antig.canal (
    id INTEGER NOT NULL, -- PK, ID Artificial sequencial (INTEGER)
    nome VARCHAR(100) NOT NULL,
    tipo system_antig.tipo_canal_enum NOT NULL, -- ENUM para {privado, público ou misto}
    data DATE NOT NULL, -- Data de início
    descricao TEXT, -- Descrição
    id_streamer INTEGER NOT NULL,
    nro_plataforma INTEGER NOT NULL,
    qtd_visualizacoes BIGINT DEFAULT 0, --Atributo derivado tratado com trigger
    PRIMARY KEY (id),
    UNIQUE (nome, nro_plataforma), -- Restrição de unicidade para a chave natural (nome do canal é único por plataforma)
    FOREIGN KEY (id_streamer) REFERENCES system_antig.Usuario(id)
        ON DELETE RESTRICT -- Não se deve remover o usuário se ele for dono de um canal
        ON UPDATE CASCADE,
    FOREIGN KEY (nro_plataforma) REFERENCES system_antig.Plataforma(nro)
        ON DELETE RESTRICT -- Não se deve remover a plataforma se ela tiver canais
        ON UPDATE CASCADE
);
CREATE TABLE system_antig.patrocinio (
    nro_empresa INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    valor FLOAT NOT NULL, -- Valor em dólares americanos
    PRIMARY KEY (nro_empresa, id_canal),
    FOREIGN KEY (nro_empresa) REFERENCES system_antig.Empresa(nro)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_canal) REFERENCES system_antig.Canal(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.nivelCanal (
    id_canal INTEGER NOT NULL,
    nivel VARCHAR(50) NOT NULL, -- Nome do nível de membro
    valor FLOAT NOT NULL, -- Valor mensal da contribuição
    gif VARCHAR(255) NOT NULL, -- Arquivo de imagem .gif associado
    PRIMARY KEY (id_canal, nivel),
    FOREIGN KEY (id_canal) REFERENCES system_antig.Canal(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.inscricao (
    id_canal INTEGER NOT NULL,
    id_membro INTEGER NOT NULL,
    nivel VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_canal, id_membro),
    FOREIGN KEY (id_membro) REFERENCES system_antig.Usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_canal, nivel) REFERENCES system_antig.NivelCanal(id_canal, nivel)
        ON DELETE RESTRICT -- Não deve permitir apagar um nível que tem membros inscritos
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.video (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL, -- FK para Canal(ID)
    titulo VARCHAR(255) NOT NULL,
    dataH TIMESTAMP NOT NULL, -- Data/hora de postagem
    tema VARCHAR(100),
    duracao INTEGER NOT NULL,
    visu_simul INTEGER,
    visu_total BIGINT,
    PRIMARY KEY (id_video, id_canal),
    UNIQUE (titulo, dataH), -- Restrição de unicidade para a chave natural (garante que não haja vídeos duplicados)
    FOREIGN KEY (id_canal) REFERENCES system_antig.Canal(id)
        ON DELETE CASCADE -- Se o canal for deletado, todos os seus vídeos são deletados
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.participa (
    id_video INTEGER NOT NULL, -- FK para Video(ID_video)
    id_canal INTEGER NOT NULL,
    id_streamer INTEGER NOT NULL, -- FK para Usuario(ID) (o participante)
    PRIMARY KEY (id_video, id_canal, id_streamer),
    FOREIGN KEY (id_video, id_canal) REFERENCES system_antig.Video(id_video, id_canal)
        ON DELETE CASCADE -- Se o vídeo for deletado, a participação é deletada
        ON UPDATE CASCADE,
    FOREIGN KEY (id_streamer) REFERENCES system_antig.Usuario(id) -- ID_streamer referencia Usuario(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.comentario (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL, -- FK para Usuario(ID)
    seq INTEGER NOT NULL, -- Número sequencial do comentário por video e usuario
    texto TEXT NOT NULL,
    dataH TIMESTAMP NOT NULL,
    coment_on BOOLEAN,
    PRIMARY KEY (id_video, id_canal, id_usuario, seq),
    FOREIGN KEY (id_video, id_canal) REFERENCES system_antig.Video(id_video, id_canal)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES system_antig.Usuario(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TYPE system_antig.status_doacao_enum AS ENUM('recusado', 'recebido', 'lido');
CREATE TABLE system_antig.doacao (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    seq_comentario INTEGER NOT NULL,
    seq_pg INTEGER NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    status system_antig.status_doacao_enum NOT NULL, -- ENUM para {recusado, recebido ou lido}
    PRIMARY KEY (id_video, id_canal, id_usuario, seq_comentario, seq_pg),
    FOREIGN KEY (id_video, id_canal, id_usuario, seq_comentario) REFERENCES system_antig.Comentario(id_video, id_canal, id_usuario, seq)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.bitCoin (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    seq_comentario INTEGER NOT NULL,
    seq_doacao INTEGER NOT NULL,
    TxID VARCHAR(64) NOT NULL,
    PRIMARY KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao),
    UNIQUE (TxID),
    FOREIGN KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao) REFERENCES system_antig.Doacao(id_video, id_canal, id_usuario, seq_comentario, seq_pg)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.payPal (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    seq_comentario INTEGER NOT NULL,
    seq_doacao INTEGER NOT NULL,
    IdPayPal VARCHAR(50) NOT NULL, -- ID PayPal de pagamento
    PRIMARY KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao),
    UNIQUE (IdPayPal),
    FOREIGN KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao) REFERENCES system_antig.Doacao(id_video, id_canal, id_usuario, seq_comentario, seq_pg)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.cartaoCredito (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    seq_comentario INTEGER NOT NULL,
    seq_doacao INTEGER NOT NULL,
    nro VARCHAR(16) NOT NULL,
    bandeira VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao),
    FOREIGN KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao) REFERENCES system_antig.Doacao(id_video, id_canal, id_usuario, seq_comentario, seq_pg)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE system_antig.mecanismoPlat (
    id_video INTEGER NOT NULL,
    id_canal INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    seq_comentario INTEGER NOT NULL,
    seq_doacao INTEGER NOT NULL,
    seq_plataforma INTEGER NOT NULL, -- Número sequencial da plataforma
    PRIMARY KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao),
    UNIQUE (seq_plataforma),
    FOREIGN KEY (id_video, id_canal, id_usuario, seq_comentario, seq_doacao) REFERENCES system_antig.Doacao(id_video, id_canal, id_usuario, seq_comentario, seq_pg)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

------------------------------------------ triggers --------------------------------------------------------------------
-- Função Lógica
CREATE OR REPLACE FUNCTION system_antig.fn_manter_qtd_visualizacoes()
RETURNS TRIGGER AS $$
DECLARE
    id_canal_afetado INTEGER;
BEGIN
    -- Descobre qual canal precisa ser atualizado
    IF (TG_OP = 'DELETE') THEN
        id_canal_afetado := OLD.id_canal;
    ELSE
        id_canal_afetado := NEW.id_canal;
    END IF;

    -- Atualiza o canal somando as visualizações de todos os vídeos dele
    UPDATE system_antig.canal
    SET qtd_visualizacoes = (
        SELECT COALESCE(SUM(visu_total), 0)
        FROM system_antig.video
        WHERE id_canal = id_canal_afetado
    )
    WHERE id = id_canal_afetado;

    -- Se houve troca de canal (UPDATE do id_canal), atualiza o canal antigo também
    IF (TG_OP = 'UPDATE' AND OLD.id_canal IS DISTINCT FROM NEW.id_canal) THEN
        UPDATE system_antig.canal
        SET qtd_visualizacoes = (
            SELECT COALESCE(SUM(visu_total), 0)
            FROM system_antig.video
            WHERE id_canal = OLD.id_canal
        )
        WHERE id = OLD.id_canal;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criação da Trigger
CREATE OR REPLACE TRIGGER trg_atualiza_visu_canal
AFTER INSERT OR UPDATE OF visu_total, id_canal OR DELETE ON system_antig.video
FOR EACH ROW
EXECUTE FUNCTION system_antig.fn_manter_qtd_visualizacoes();


-- Função Lógica
CREATE OR REPLACE FUNCTION system_antig.fn_manter_qtd_users_plataforma()
RETURNS TRIGGER AS $$
DECLARE
    id_plataforma_afetada INTEGER;
BEGIN
    -- Descobre qual plataforma foi afetada
    IF (TG_OP = 'DELETE') THEN
        id_plataforma_afetada := OLD.nro_plataforma;
    ELSE
        id_plataforma_afetada := NEW.nro_plataforma;
    END IF;

    -- Recalcula a contagem total de usuários daquela plataforma
    UPDATE system_antig.plataforma
    SET qtd_users = (
        SELECT COUNT(*)
        FROM system_antig.plataformausuario
        WHERE nro_plataforma = id_plataforma_afetada
    )
    WHERE nro = id_plataforma_afetada;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criação da Trigger
CREATE OR REPLACE TRIGGER trg_atualiza_users_plataforma
AFTER INSERT OR DELETE ON system_antig.plataformausuario
FOR EACH ROW
EXECUTE FUNCTION system_antig.fn_manter_qtd_users_plataforma();CREATE OR REPLACE FUNCTION system_antig.f_patrocinios_por_empresa(
    _empresa_nome TEXT DEFAULT NULL
)
RETURNS TABLE (
    empresa_patrocinadora VARCHAR,
    canal_nome VARCHAR,
    valor_patrocinio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        E.nome AS empresa_patrocinadora,
        C.nome AS canal_nome,
        P.valor::NUMERIC(10, 2) AS valor_patrocinio
    FROM
        system_antig.patrocinio P
    JOIN
        system_antig.empresa E ON P.nro_empresa = E.nro
    JOIN
        system_antig.canal C ON P.id_canal = C.id
    WHERE
        _empresa_nome IS NULL OR E.nome ILIKE '%' || _empresa_nome || '%'
    ORDER BY
        E.nome, P.valor DESC;
END;
$$;
-- Exemplo de uso (sem filtro):
-- SELECT * FROM system_antig.f_patrocinios_por_empresa();
-- Exemplo de uso (com filtro):
-- SELECT * FROM system_antig.f_patrocinios_por_empresa('TechCorp');

CREATE OR REPLACE FUNCTION system_antig.f_membros_e_desembolso(
    _usuario_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_usuario INTEGER,
    nick_usuario VARCHAR,
    total_canais_membro BIGINT,
    valor_mensal_total_desembolsado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        U.id AS id_usuario,
        U.nick AS nick_usuario,
        COUNT(I.id_membro) AS total_canais_membro,
        SUM(NC.valor)::NUMERIC(10, 2) AS valor_mensal_total_desembolsado
    FROM
        system_antig.usuario U
    JOIN
        system_antig.inscricao I ON U.id = I.id_membro
    JOIN
        system_antig.nivelCanal NC ON I.id_canal = NC.id_canal AND I.nivel = NC.nivel
    WHERE
        _usuario_id IS NULL OR U.id = _usuario_id
    GROUP BY
        U.id, U.nick
    ORDER BY
        valor_mensal_total_desembolsado DESC, total_canais_membro DESC;
END;
$$;

-- Exemplo de uso (sem filtro):
-- SELECT * FROM system_antig.f_membros_e_desembolso();
-- Exemplo de uso (com filtro):
-- SELECT * FROM system_antig.f_membros_e_desembolso(123);

CREATE OR REPLACE FUNCTION system_antig.f_doacoes_por_canal(
    _canal_nome TEXT DEFAULT NULL
)
RETURNS TABLE (
    id_canal INTEGER,
    nome_canal VARCHAR,
    valor_total_doado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       C.id AS id_canal,
       C.nome AS nome_canal,
       SUM(D.valor)::NUMERIC(10, 2) AS valor_total_doado
    FROM
       system_antig.doacao D
    JOIN
       system_antig.canal C ON D.id_canal = C.id
    WHERE
       -- 1. Otimização: Removemos 'recusado' usando IN para ativar o índice
       D.status IN ('recebido', 'lido')
       -- 2. Filtro opcional por nome
       AND (_canal_nome IS NULL OR C.nome ILIKE '%' || _canal_nome || '%')
    GROUP BY
       C.id, C.nome
    HAVING
       SUM(D.valor) > 0
    ORDER BY
       valor_total_doado DESC;
END;
$$;

-- Exemplo de uso (sem filtro):
-- SELECT * FROM system_antig.f_doacoes_por_canal();
-- Exemplo de uso (com filtro):
-- SELECT * FROM system_antig.f_doacoes_por_canal('Aulas de DB');

CREATE OR REPLACE FUNCTION system_antig.f_doacoes_lidas_por_video(
    _video_titulo TEXT DEFAULT NULL
)
RETURNS TABLE (
    id_video INTEGER,
    titulo_video VARCHAR,
    soma_doacoes_lidas NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       d.id_video,
       v.titulo AS titulo_video,
       SUM(d.valor)::NUMERIC(10, 2) AS soma_doacoes_lidas
    FROM
       system_antig.doacao d
    JOIN
       system_antig.video v
       ON d.id_video = v.id_video AND d.id_canal = v.id_canal
    WHERE
       d.status = 'lido' -- Filtro direto na tabela (Usa o Índice!)
       AND (_video_titulo IS NULL OR v.titulo ILIKE '%' || _video_titulo || '%')
    GROUP BY
       d.id_video, v.titulo
    ORDER BY
       soma_doacoes_lidas DESC;
END;
$$;
-- Exemplo de uso (sem filtro):
-- SELECT * FROM system_antig.f_doacoes_lidas_por_video();
-- Exemplo de uso (com filtro):
-- SELECT * FROM system_antig.f_doacoes_lidas_por_video('Introdução ao SQL');

CREATE OR REPLACE FUNCTION system_antig.f_ranking_patrocinio(
    k_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank_patrocinio BIGINT,
    id_canal INTEGER,
    nome_canal VARCHAR,
    valor_total_patrocinio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       RANK() OVER (ORDER BY SUM(P.valor) DESC) AS rank_patrocinio,
       C.id AS id_canal,
       C.nome AS nome_canal,
       SUM(P.valor)::NUMERIC(10, 2) AS valor_total_patrocinio
    FROM
       system_antig.patrocinio P
    JOIN
       system_antig.canal C ON P.id_canal = C.id
    GROUP BY
       C.id, C.nome
    ORDER BY
       valor_total_patrocinio DESC
    LIMIT k_limite;
END;
$$;

-- Exemplo de uso (Top 5 canais):
-- SELECT * FROM system_antig.f_ranking_patrocinio(5);
-- Exemplo de uso (Top 10 canais, usando o padrão):
-- SELECT * FROM system_antig.f_ranking_patrocinio();

CREATE OR REPLACE FUNCTION system_antig.f_ranking_aportes_membros(
    k_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank_aportes BIGINT,
    id_canal INTEGER,
    nome_canal VARCHAR,
    valor_total_aportes NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       -- Classifica os canais com base na soma dos aportes dos membros
       RANK() OVER (ORDER BY SUM(NC.valor) DESC) AS rank_aportes,
       C.id AS id_canal,
       C.nome AS nome_canal,
       SUM(NC.valor)::NUMERIC(10, 2) AS valor_total_aportes
    FROM
       system_antig.inscricao I
    JOIN
       system_antig.canal C ON I.id_canal = C.id
    JOIN
       -- Une com NivelCanal para obter o valor mensal do nível de inscrição
       system_antig.nivelCanal NC ON I.id_canal = NC.id_canal AND I.nivel = NC.nivel
    GROUP BY
       C.id, C.nome
    ORDER BY
       valor_total_aportes DESC
    LIMIT k_limite;
END;
$$;

CREATE OR REPLACE FUNCTION system_antig.f_ranking_doacoes(
    k_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank_doacao BIGINT,
    id_canal INTEGER,
    nome_canal VARCHAR,
    valor_total_doado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       RANK() OVER (ORDER BY SUM(D.valor) DESC) AS rank_doacao,
       C.id AS id_canal,
       C.nome AS nome_canal,
       SUM(D.valor)::NUMERIC(10, 2) AS valor_total_doado
    FROM
       system_antig.doacao D
    JOIN
       system_antig.canal C ON D.id_canal = C.id
    WHERE
       D.status IN ('recebido', 'lido') -- Usa o índice idx_doacao_recebidas_lidas
    GROUP BY
       C.id, C.nome
    ORDER BY
       valor_total_doado DESC
    LIMIT k_limite;
END;
$$;

CREATE OR REPLACE FUNCTION system_antig.f_ranking_faturamento_total(
    k_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank_faturamento BIGINT,
    id_canal INTEGER,
    nome_canal VARCHAR,
    faturamento_total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
       RANK() OVER (ORDER BY mv.faturamento_bruto DESC) AS rank_faturamento,
       mv.id_canal,
       mv.nome_canal,
       mv.faturamento_bruto::NUMERIC(10, 2) AS faturamento_total
    FROM
       system_antig.mv_faturamento_canal mv
    ORDER BY
       rank_faturamento
    LIMIT k_limite;
END;
$$;


------------------------------------------------- Transactions ---------------------------------------------------------

CREATE OR REPLACE PROCEDURE system_antig.sp_registrar_doacao_unificada(
    -- 1. Parâmetros da Tabela Pai (DOACAO)
    -- Note que NÃO tem _tipo_pagamento aqui para inserir na tabela
    _id_video INT,
    _id_canal INT,
    _id_usuario INT,
    _seq_comentario INT,
    _seq_pg INT,
    _valor NUMERIC,
    _status system_antig.status_doacao_enum,

    -- 2. Variável de Controle (Apenas para a lógica do IF/ELSE)
    -- Essa informação morre aqui na função, não vai pro banco!
    _tipo_pagamento VARCHAR,

    -- 3. Parâmetros Específicos das Tabelas Filhas (Opcionais)
    _txid VARCHAR DEFAULT NULL,
    _id_paypal VARCHAR DEFAULT NULL,
    _nro_cartao VARCHAR DEFAULT NULL,
    _bandeira VARCHAR DEFAULT NULL,
    _seq_plataforma INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validação de Segurança
    IF _tipo_pagamento NOT IN ('bitcoin', 'paypal', 'cartao', 'plataforma') THEN
        RAISE EXCEPTION 'Tipo inválido. Use: bitcoin, paypal, cartao ou plataforma.';
    END IF;

    -- 1. Inserir na Tabela Pai (DOACAO)
    -- Veja: Inserimos APENAS as colunas que existem na sua tabela. O tipo não entra aqui.
    INSERT INTO system_antig.doacao (id_video, id_canal, id_usuario, seq_comentario, seq_pg, valor, status)
    VALUES (_id_video, _id_canal, _id_usuario, _seq_comentario, _seq_pg, _valor, _status);

    -- 2. Lógica de Decisão (Factory)
    -- Aqui usamos a variável apenas para saber em qual tabela filha gravar
    IF _tipo_pagamento = 'bitcoin' THEN
        IF _txid IS NULL THEN RAISE EXCEPTION 'Para Bitcoin, informe o TxID'; END IF;

        INSERT INTO system_antig.bitcoin (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, TxID)
        VALUES (_id_video, _id_canal, _id_usuario, _seq_comentario, _seq_pg, _txid);

    ELSIF _tipo_pagamento = 'paypal' THEN
        IF _id_paypal IS NULL THEN RAISE EXCEPTION 'Para PayPal, informe o IDPayPal'; END IF;

        INSERT INTO system_antig.paypal (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, IdPayPal)
        VALUES (_id_video, _id_canal, _id_usuario, _seq_comentario, _seq_pg, _id_paypal);

    ELSIF _tipo_pagamento = 'cartao' THEN
        IF _nro_cartao IS NULL THEN RAISE EXCEPTION 'Para Cartão, informe número e bandeira'; END IF;

        INSERT INTO system_antig.cartaoCredito (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, nro, bandeira)
        VALUES (_id_video, _id_canal, _id_usuario, _seq_comentario, _seq_pg, _nro_cartao, _bandeira);

    ELSIF _tipo_pagamento = 'plataforma' THEN
        IF _seq_plataforma IS NULL THEN RAISE EXCEPTION 'Informe o seq_plataforma'; END IF;

        INSERT INTO system_antig.mecanismoPlat (id_video, id_canal, id_usuario, seq_comentario, seq_doacao, seq_plataforma)
        VALUES (_id_video, _id_canal, _id_usuario, _seq_comentario, _seq_pg, _seq_plataforma);
    END IF;

    -- O COMMIT é automático ao final se não houver erro.
END;
$$;

CREATE OR REPLACE PROCEDURE system_antig.sp_publicar_video_com_convidados(
    -- Dados do Vídeo
    _id_video INT,
    _id_canal INT,
    _titulo VARCHAR,
    _tema VARCHAR,
    _duracao INT,
    _visu_total BIGINT,
    -- Lista de Convidados (Array de IDs de usuários)
    _lista_ids_convidados INT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    _id_convidado INT;
BEGIN
    -- 1. Inserir o Vídeo (Tabela Mestre)
    INSERT INTO system_antig.video (id_video, id_canal, titulo, dataH, tema, duracao, visu_simul, visu_total)
    VALUES (_id_video, _id_canal, _titulo, NOW(), _tema, _duracao, 0, _visu_total);
    -- 2. Inserir os Participantes (Tabela Detalhe)
    -- O Loop varre o Array recebido como parâmetro
    IF _lista_ids_convidados IS NOT NULL THEN
        FOREACH _id_convidado IN ARRAY _lista_ids_convidados
        LOOP
            -- Verifica se o convidado não é o próprio dono do canal (regra de negócio opcional)
            -- Insere na tabela de relacionamento
            INSERT INTO system_antig.participa (id_video, id_canal, id_streamer)
            VALUES (_id_video, _id_canal, _id_convidado);
        END LOOP;
    END IF;
    -- Se tudo der certo, o COMMIT é automático no final.
    -- Se der erro em qualquer INSERT (vídeo ou convidado), o Postgres faz ROLLBACK automático de tudo.
END;
$$;----------------------------------------------------------------------------Indices-------------------------------------------------------------------------------------------
-- Índice 1(Para a Consulta 4 e 8, 3 e 7)
-- foi escolhido b+tree porque o indice hash n tem a opcao de include e criacao de indice em multiplas colunas
-- ignora o status "recusado", é criado só para status validos e acelera a leitura
-- a de valor é para acelerar a soma dos valores lendo apenas o indice, ajudando no custo da consulta sem precisar acessar a tabela principal
CREATE INDEX idx_doacao_recebidas_lidas
ON system_antig.doacao (id_video, id_canal) INCLUDE (valor)
WHERE status IN ('lido', 'recebido');


-- 2. Patrocínio Inverso (Join Reverso - Consulta 5 e View Materializada)
--Justificativa: O índice da PK começa por empresa. Este índice permite buscar/agrupar eficientemente por Canal.
CREATE INDEX idx_patrocinio_id_canal
ON system_antig.patrocinio (id_canal);

-- 3. Receita de Membros (Covering Index)
-- Cobre todas as colunas usadas no JOIN com NivelCanal (Queries 2, 6, 8)
-- precisa cruzar a tabela inscricao e nivel canal para o faturamento, utilizando a chave estrangeira composta (id canal e nivel) esse indice abrange exatamente elas otimizando as juncoes(id membro permite o count usando apenas o indice)
CREATE INDEX idx_inscricao_nivel_full
ON system_antig.inscricao (id_canal, nivel, id_membro);

-- 4. Busca de Usuário (Simple Lookup)
-- Otimiza o filtro "WHERE usuario = X" (Query 2)
-- a funcao da consulta permite filtrar por membro(id), esse indice ajuda a nao precisar ler a tabela toda reduzindo a complexidade de busca
CREATE INDEX idx_inscricao_membro_fk
ON system_antig.inscricao (id_membro);

-- 5. Busca Textual em Empresa (Filtro Opcional - Consulta 1)
-------------------- Justificativa: Acelera a função 'f_patrocinios_por_empresa' que filtra pelo nome (string).
CREATE INDEX idx_empresa_nome
ON system_antig.empresa (nome);


--------------------------------------------------------------VIEWS----------------------------------------------------

-- 1. Materializada
-- na consulta 8 há muitos lefts joins com tabelas volumosas, a escolha do materializado foi para diminuir o overhead excessivo, pois a materializada pré calcula o total permitindo uma leitura simples
CREATE MATERIALIZED VIEW system_antig.mv_faturamento_canal AS
WITH ReceitaPatrocinio AS (
    SELECT id_canal, SUM(valor) AS total_patrocinio
    FROM system_antig.patrocinio
    GROUP BY id_canal
),
ReceitaAportes AS (
    SELECT i.id_canal, SUM(nc.valor) AS total_aportes
    FROM system_antig.inscricao i
    JOIN system_antig.nivelcanal nc
      ON i.id_canal = nc.id_canal AND i.nivel = nc.nivel
    GROUP BY i.id_canal
),
ReceitaDoacoes AS (
    SELECT v.id_canal, SUM(d.valor) AS total_doacoes
    FROM system_antig.doacao d
    JOIN system_antig.video v
      ON d.id_video = v.id_video AND d.id_canal = v.id_canal
    GROUP BY v.id_canal
)
SELECT
    c.id AS id_canal,
    c.nome AS nome_canal,
    COALESCE(rp.total_patrocinio, 0.00) AS val_patrocinio,
    COALESCE(ra.total_aportes, 0.00) AS val_aportes,
    COALESCE(rd.total_doacoes, 0.00) AS val_doacoes,
    (COALESCE(rp.total_patrocinio, 0.00) +
     COALESCE(ra.total_aportes, 0.00) +
     COALESCE(rd.total_doacoes, 0.00)) AS faturamento_bruto
FROM system_antig.canal c
LEFT JOIN ReceitaPatrocinio rp ON c.id = rp.id_canal
LEFT JOIN ReceitaAportes ra ON c.id = ra.id_canal
LEFT JOIN ReceitaDoacoes rd ON c.id = rd.id_canal
WITH DATA;

-- 2. Virtual: Detalhes de membros por usuário (otimiza C2, C6 - sua sugestão)
-- diminui a complexidade da fk composta de inscricao e nivelCanal, virtual porque os dados de inscricao são volateis
CREATE VIEW system_antig.v_detalhes_membros AS
SELECT
    i.id_membro,
    i.id_canal,
    nc.nivel,
    nc.valor AS valor_mensal
FROM system_antig.inscricao i
JOIN system_antig.nivelcanal nc ON i.id_canal = nc.id_canal AND i.nivel = nc.nivel;

-- 3. Virtual
-- Facilita a identificação de conteúdo de alta performance (viral) calculando uma métrica composta (Taxa de Engajamento) que não existe nativamente nas tabelas.
CREATE OR REPLACE VIEW system_antig.v_videos_virais AS
SELECT
    v.id_video,
    v.titulo,
    c.nome AS nome_canal,
    v.visu_total,
    COUNT(com.seq) AS total_comentarios,
    -- Cálculo de Engajamento: (Comentarios / Visualizações) * 100
    -- CASE para evitar divisão por zero
    CASE
        WHEN v.visu_total > 0 THEN (COUNT(com.seq)::NUMERIC / v.visu_total) * 100
        ELSE 0
    END AS taxa_engajamento
FROM system_antig.video v
JOIN system_antig.canal c ON v.id_canal = c.id
LEFT JOIN system_antig.comentario com
    ON v.id_video = com.id_video AND v.id_canal = com.id_canal
GROUP BY v.id_video, v.titulo, c.nome, v.visu_total
HAVING v.visu_total > 1000 -- Apenas vídeos com relevância mínima
ORDER BY taxa_engajamento DESC;

-- 4. Materializada
--Consolida dados dispersos de múltiplos canais para gerar o perfil de performance do Streamer. Materializada pois o cálculo de audiência total de um influenciador envolve varrer os historicos de video
CREATE MATERIALIZED VIEW system_antig.mv_performance_streamers AS
SELECT
    u.id AS id_streamer,
    u.nick,
    -- Conta canais únicos
    COUNT(DISTINCT c.id) AS qtd_canais,
    -- Conta vídeos (ignora se for null)
    COUNT(v.id_video) AS total_videos_postados,
    -- Soma views (trata nulo como 0 se não tiver vídeos)
    COALESCE(SUM(v.visu_total), 0) AS audiencia_total_acumulada
FROM system_antig.usuario u
JOIN system_antig.canal c ON u.id = c.id_streamer
LEFT JOIN system_antig.video v ON c.id = v.id_canal
GROUP BY u.id, u.nick
WITH DATA;

-- 5. Virtual
--Desnormaliza a localização do usuário, entregando diretamente o fator de conversão monetária associado a ele, facilitando cálculos de pagamentos internacionais.
CREATE OR REPLACE VIEW system_antig.v_usuarios_internacionais AS
SELECT
    u.id,
    u.nick,
    p.nome AS pais,
    c.moeda AS codigo_moeda,
    c.fator_conver AS taxa_cambio_usd
FROM system_antig.usuario u
JOIN system_antig.pais p ON u.id_pais = p.id
JOIN system_antig.conversao c ON p.id_conversao = c.id;


-- Para mv_faturamento_canal (A chave única é o id_canal)
CREATE UNIQUE INDEX idx_mv_faturamento_unique ON system_antig.mv_faturamento_canal (id_canal);
-- Para mv_performance_streamers (A chave única é o id_streamer)
CREATE UNIQUE INDEX idx_mv_performance_unique ON system_antig.mv_performance_streamers (id_streamer);

CREATE OR REPLACE PROCEDURE system_antig.sp_refresh_views_analiticas()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualiza o Faturamento sem bloquear leituras (Graças ao idx_mv_faturamento_unique)
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_antig.mv_faturamento_canal;

    -- Atualiza a Performance sem bloquear leituras (Graças ao idx_mv_performance_unique)
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_antig.mv_performance_streamers;

    RAISE NOTICE 'Views Analíticas atualizadas com sucesso (modo concorrente) em: %', NOW();
END;
$$;

-- 4. Atualizar as Views Materializadas
REFRESH MATERIALIZED VIEW system_antig.mv_faturamento_canal;
REFRESH MATERIALIZED VIEW system_antig.mv_performance_streamers;