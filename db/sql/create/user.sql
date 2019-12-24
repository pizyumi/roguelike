create table t_user (
    id integer not null, 
    name character varying(256), 
    password character varying(256), 
    delete_date timestamp with time zone, 
    
    primary key (id)
);
