--
-- PostgreSQL database dump
--
-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.0
SET
    statement_timeout = 0;

SET
    lock_timeout = 0;

SET
    idle_in_transaction_session_timeout = 0;

SET
    client_encoding = 'UTF8';

SET
    standard_conforming_strings = ON;

SELECT
    pg_catalog.set_config('search_path', '', false);

SET
    check_function_bodies = false;

SET
    xmloption = content;

SET
    client_min_messages = warning;

SET
    row_security = off;

--
-- Name: intarray; Type: EXTENSION; Schema: -; Owner: -
--
CREATE EXTENSION IF NOT EXISTS intarray WITH SCHEMA public;

--
-- Name: EXTENSION intarray; Type: COMMENT; Schema: -; Owner: 
--
COMMENT ON EXTENSION intarray IS 'functions, operators, and index support for 1-D arrays of integers';

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--
COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--
COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';

SET
    default_tablespace = '';

SET
    default_table_access_method = HEAP;

--
-- Name: hn_article; Type: TABLE; Schema: public; Owner: julien
--
CREATE TABLE public.hn_article (
    id integer NOT NULL,
    text text,
    title text,
    favicon text,
    language text,
    tags text
);

ALTER TABLE
    public.hn_article OWNER TO julien;

--
-- Name: hn_embeddings; Type: TABLE; Schema: public; Owner: julien
--
CREATE TABLE public.hn_embeddings (
    id integer NOT NULL,
    embedding public.vector(1536),
    path integer []
);

ALTER TABLE
    public.hn_embeddings OWNER TO julien;

--
-- Name: hn_paths; Type: TABLE; Schema: public; Owner: julien
--
CREATE TABLE public.hn_paths (path integer [] NOT NULL, title text);

ALTER TABLE
    public.hn_paths OWNER TO julien;

--
-- Name: hn_post; Type: TABLE; Schema: public; Owner: julien
--
CREATE TABLE public.hn_post (
    id integer NOT NULL,
    TYPE text NOT NULL,
    by text,
    "time" bigint,
    text text,
    parent integer,
    kids text [],
    url text,
    descendants integer,
    score integer,
    title text,
    deleted boolean,
    dead boolean
);

ALTER TABLE
    public.hn_post OWNER TO julien;

--
-- Name: hn_article hn_article_pkey; Type: CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_article
ADD
    CONSTRAINT hn_article_pkey PRIMARY KEY (id);

--
-- Name: hn_embeddings hn_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_embeddings
ADD
    CONSTRAINT hn_embeddings_pkey PRIMARY KEY (id);

--
-- Name: hn_paths hn_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_paths
ADD
    CONSTRAINT hn_paths_pkey PRIMARY KEY (path);

--
-- Name: hn_post hn_post_pkey; Type: CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_post
ADD
    CONSTRAINT hn_post_pkey PRIMARY KEY (id);

--
-- Name: hn_embeddings_embedding_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX hn_embeddings_embedding_idx ON public.hn_embeddings USING ivfflat (embedding public.vector_ip_ops) WITH (lists = '100');

--
-- Name: hn_post_descendants_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX hn_post_descendants_idx ON public.hn_post USING btree (descendants);

--
-- Name: hn_post_id_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX hn_post_id_idx ON public.hn_post USING btree (id);

--
-- Name: hn_post_score_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX hn_post_score_idx ON public.hn_post USING btree (score);

--
-- Name: hn_post_time_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX hn_post_time_idx ON public.hn_post USING btree ("time");

--
-- Name: path_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX path_idx ON public.hn_embeddings USING gist (path);

--
-- Name: trgm_idx; Type: INDEX; Schema: public; Owner: julien
--
CREATE INDEX trgm_idx ON public.hn_paths USING gist (title public.gist_trgm_ops);

--
-- Name: hn_article hn_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_article
ADD
    CONSTRAINT hn_article_id_fkey FOREIGN KEY (id) REFERENCES public.hn_post(id);

--
-- Name: hn_embeddings hn_embeddings_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: julien
--
ALTER TABLE
    ONLY public.hn_embeddings
ADD
    CONSTRAINT hn_embeddings_id_fkey FOREIGN KEY (id) REFERENCES public.hn_post(id);

--
-- PostgreSQL database dump complete
--