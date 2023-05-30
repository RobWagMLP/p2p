select sp_drop_function('sp_create_consultation_room');

create or replace  function sp_create_consultation_room(
  room_id             bigint    ,
  person_id_create    bigint    ,
  participants        bigint[]  ,
  datetime_open       timestamp with time zone default null
)
returns void  
as
$$
declare
  v_room_id          alias for room_id;
  v_person_id_create alias for person_id_create;
  v_participants     alias for participants;
  v_datetime_open    alias for datetime_open;
begin        
   insert 
     into consultation_room(
      consultation_room_id,
      person_id_create    ,
      datetime_create     ,
      datetime_open       
     ) 
     values(
      v_room_id            ,
      v_person_id_create   ,
      statement_timestamp(),
      v_datetime_open
     );

    insert
      into consultation_room_access(
        consultation_room_id  ,
        person_id             ,
        datetime_create       ,
        valid  
      ) 
      select
        v_room_id             ,
        participant_id        ,
        statement_timestamp() ,
        true
      from unnest(v_participants) as participant_id;
end;
$$
language plpgsql
SECURITY DEFINER;

