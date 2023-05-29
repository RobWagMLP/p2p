create or replace  function sp_drop_function(v_name varchar)
returns void
as
$$
--Revision $Id: a6c74dc65ad324230e356472d271137542823223 $
declare v_sql varchar;
        v_dbo name   ;
begin
  ----------------------------------------------------------------------
  -- i have no clue why role inheritance does not work as expected, i assume it relates to using schema public
  -- but to prevent wrongly created functions... we raise exception.... and hope that everyone uses a transaction to create functions...
  select /*+ indexscan(pg_database) */ 
         datdba::regrole 
    into v_dbo
    from pg_database 
   where datname = current_database();
  if current_user <> v_dbo then
    raise exception 'user % is not dbo of current database, please explicitly use role %' , current_user, v_dbo;
  end if;
  for v_sql in(select format('DROP FUNCTION %s.%s(%s)'                ,
                              quote_ident(n.nspname)                  ,
                              quote_ident(p.proname)                  ,
                              pg_get_function_identity_arguments(p.oid)
                            )
                 FROM pg_catalog.pg_proc p,
                      pg_catalog.pg_namespace n
                where n.oid     = p.pronamespace
                  and n.nspname = current_schema()
                  and p.proname = v_name) loop
     raise notice '%,%',clock_timestamp(), v_sql;
     execute v_sql;
   end loop;

end;
$$
LANGUAGE PLPGSQL;

