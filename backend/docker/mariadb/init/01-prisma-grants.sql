-- Local development only: Prisma Migrate needs these global privileges
-- to create and remove its temporary shadow database.
GRANT CREATE, DROP, ALTER, REFERENCES ON *.* TO 'johndoe'@'%';
