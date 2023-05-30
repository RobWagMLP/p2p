
create schema IF NOT exists utils;

CREATE EXTENSION IF NOT EXISTS pg_stat_statements with schema utils;
CREATE EXTENSION IF NOT EXISTS btree_gist         with schema utils;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS from PUBLIC;



-- --> die user richten wir spaeter ein...
--begin transaction;
--do
--$$
--begin
--  if not exists (select 1 from  pg_catalog.pg_user where usename = 'ebaas') then
--    create user ebaas with password 'y5M86EwBYj9z';
--  end if ;
--end;
--$$
--language plpgsql;
--
--
--create schema if not exists ebaas;
--revoke all on schema ebaas from public;  
--grant all on schema  ebaas to postgres;
--grant all on schema  ebaas to ebaas;
--alter schema ebaas owner to ebaas;