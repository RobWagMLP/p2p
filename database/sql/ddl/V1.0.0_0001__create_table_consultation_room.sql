create table consultation_room(
  consultation_room_id         bigserial not null ,
  person_id_create             bigint    not null,
  datetime_create              timestamp with time zone not null,
  datetime_open                timestamp with time zone         ,
  datetime_close               timestamp with time zone         ,
  constraint consultation_room_pk primary key(consultation_room_id) );
  
 create table consultation_room_access(
   consultation_room_access_id         bigserial not null,
   consultation_room_id                bigint    not null,
   person_id                           bigint    not null,
   datetime_create                     timestamp with time zone not null,
   datetime_invalidate                 timestamp with time zone not null,
   valid                               boolean   not null               ,
   constraint consultation_room_access_pk primary key(consultation_room_access_id),
   constraint consultation_room_access_fk foreign key(consultation_room_id) references consultation_room(consultation_room_id) );
