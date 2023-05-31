select sp_drop_function('sp_close_consultation_room');

create or replace  function sp_close_consultation_room(
  room_id             bigint    
)
returns void  
as
$$
declare
  v_room_id          alias for room_id;
begin        
   update consultation_room as cr
      set datetime_close = statement_timestamp()
      where cr.consultation_room_id = v_room_id; 
   
   update consultation_room_access as ca
      set datetime_invalidate = statement_timestamp(),
          valid               = false
      where ca.consultation_room_id = v_room_id;
end;
$$
language plpgsql
SECURITY DEFINER;

