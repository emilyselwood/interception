drop table if exists scoreboard;

create table scoreboard (
    id integer primary key autoincrement,
    name varchar(10) not null,
    score int not null,
    timestamp int not null
);
