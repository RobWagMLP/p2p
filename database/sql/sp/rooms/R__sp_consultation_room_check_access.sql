select sp_drop_function('sp_consultation_room_check_access');

create or replace  function sp_consultation_room_check_access(
    room_id             bigint    ,
    person_id           bigint    ,
out has_access          boolean
)
returns boolean 
as
$$
declare
  v_room_id          alias for room_id;
  v_person_id        alias for person ;
  v_has_access       alias for has_access;
begin        
   has_access = exists(select 1 
                         from  consultation_room cr
                          join consultation_room_access ca
                            on ca.consultation_room_id = cr.consultation_room_id
                          where cr.consultation_room_id = v_room_id
                            and (cr.datetime_close is null or tstzrange(ca.datetime_open, ca.datetime_close) @> statement_timestamp() )
                            and ca.person_id = v_person_id
                            and ca.valid = true
                            and ca.datetime_invalidate = null
                      );
end;
$$
language plpgsql
SECURITY DEFINER;

