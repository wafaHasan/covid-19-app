DROP TABLE IF EXISTS covido;
CREATE TABLE covido(
    id SERIAL PRIMARY KEY,
    country VARCHAR(255),
    confirmed VARCHAR(255),
    deathes VARCHAR(255),
    recovered VARCHAR(255),
    date VARCHAR(255)
)
