--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    upload_date timestamp with time zone DEFAULT now(),
    expiry_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    cpf text NOT NULL,
    birth_date date,
    hire_date date NOT NULL,
    contract_type text NOT NULL,
    salary numeric(10,2),
    workload integer DEFAULT 40 NOT NULL,
    role_id uuid,
    department_id uuid,
    unit_id uuid,
    status text DEFAULT 'Ativo'::text NOT NULL,
    photo_url text,
    address text,
    city text,
    state text,
    zip_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employees_contract_type_check CHECK ((contract_type = ANY (ARRAY['CLT'::text, 'PJ'::text, 'Temporário'::text, 'Estágio'::text, 'Terceirizado'::text]))),
    CONSTRAINT employees_status_check CHECK ((status = ANY (ARRAY['Ativo'::text, 'Férias'::text, 'Afastado'::text, 'Demitido'::text])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    level integer,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timesheets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    lunch_start time without time zone,
    lunch_end time without time zone,
    hours_worked numeric(5,2),
    overtime_hours numeric(5,2) DEFAULT 0,
    status text DEFAULT 'Presente'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT timesheets_status_check CHECK ((status = ANY (ARRAY['Presente'::text, 'Falta'::text, 'Atestado'::text, 'Férias'::text, 'Feriado'::text])))
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    city text,
    state text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- Name: employees employees_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_cpf_key UNIQUE (cpf);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_employee_id_date_key UNIQUE (employee_id, date);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: units units_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_code_key UNIQUE (code);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_department ON public.employees USING btree (department_id);


--
-- Name: idx_employees_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_role ON public.employees USING btree (role_id);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_employees_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_unit ON public.employees USING btree (unit_id);


--
-- Name: idx_timesheets_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timesheets_date ON public.timesheets USING btree (date);


--
-- Name: idx_timesheets_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timesheets_employee ON public.timesheets USING btree (employee_id);


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: timesheets update_timesheets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: units update_units_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employee_documents employee_documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees employees_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: employees employees_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: timesheets timesheets_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: roles Usuários autenticados podem atualizar cargos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar cargos" ON public.roles FOR UPDATE TO authenticated USING (true);


--
-- Name: departments Usuários autenticados podem atualizar departamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar departamentos" ON public.departments FOR UPDATE TO authenticated USING (true);


--
-- Name: employee_documents Usuários autenticados podem atualizar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar documentos" ON public.employee_documents FOR UPDATE TO authenticated USING (true);


--
-- Name: employees Usuários autenticados podem atualizar funcionários; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar funcionários" ON public.employees FOR UPDATE TO authenticated USING (true);


--
-- Name: timesheets Usuários autenticados podem atualizar timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar timesheets" ON public.timesheets FOR UPDATE TO authenticated USING (true);


--
-- Name: units Usuários autenticados podem atualizar unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem atualizar unidades" ON public.units FOR UPDATE TO authenticated USING (true);


--
-- Name: roles Usuários autenticados podem criar cargos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar cargos" ON public.roles FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: departments Usuários autenticados podem criar departamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar departamentos" ON public.departments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: employee_documents Usuários autenticados podem criar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar documentos" ON public.employee_documents FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: employees Usuários autenticados podem criar funcionários; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar funcionários" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: timesheets Usuários autenticados podem criar timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar timesheets" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: units Usuários autenticados podem criar unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem criar unidades" ON public.units FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: roles Usuários autenticados podem ler cargos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler cargos" ON public.roles FOR SELECT TO authenticated USING (true);


--
-- Name: departments Usuários autenticados podem ler departamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler departamentos" ON public.departments FOR SELECT TO authenticated USING (true);


--
-- Name: employee_documents Usuários autenticados podem ler documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler documentos" ON public.employee_documents FOR SELECT TO authenticated USING (true);


--
-- Name: employees Usuários autenticados podem ler funcionários; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler funcionários" ON public.employees FOR SELECT TO authenticated USING (true);


--
-- Name: timesheets Usuários autenticados podem ler timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler timesheets" ON public.timesheets FOR SELECT TO authenticated USING (true);


--
-- Name: units Usuários autenticados podem ler unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem ler unidades" ON public.units FOR SELECT TO authenticated USING (true);


--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: timesheets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


