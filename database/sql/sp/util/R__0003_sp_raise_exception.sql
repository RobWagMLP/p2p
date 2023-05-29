select sp_drop_function('sp_raise_exception');

create or replace  function sp_raise_exception(
  error_code          int                    ,
  error_text          varchar   default null ,
  release_requests_id bigint[]  default null ,
  hint                json      default null
)
returns void 
as
$$
declare
  v_error_code                 alias for error_code              ;
  v_error_text                 alias for error_text              ;
  v_release_requests_id        alias for release_requests_id     ;
  v_hint                       alias for hint                    ;
  v_release_status             char(1)                           ;
--Revision $Id: f08d6c87498272ebf22f2dc65f17bc921041a137 $ 
begin        
   
  if v_error_text is null then 
    select e.error_text
      into v_error_text 
      from error_code e
     where e.error_code = v_error_code;
  end if;
  v_error_text := coalesce(v_error_text,'error_text to be set');
  
  if v_release_requests_id is not null then
      select status 
        from release_requests r
        into v_release_status 
       where r.release_requests_id = any( v_release_requests_id ) 
         and r.error_code          = v_error_code;
      if  v_release_status is not null or v_release_status = 'R' then
           return;
      end if;
  end if; 
  
  if exists (select 1 from release_rules rr where rr.error_code = v_error_code) then
     if v_hint is null then
       RAISE EXCEPTION '%', v_error_code using DETAIL = v_error_text, errcode = 'NDREL';
     else
       RAISE EXCEPTION '%', v_error_code using DETAIL = v_error_text, errcode = 'NDREL', hint = v_hint;
     end if;
  end if;
     
  RAISE EXCEPTION '%', v_error_code using DETAIL = v_error_text;
end;
$$
language plpgsql
SECURITY DEFINER;

