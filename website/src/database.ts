import postgres from "postgres";

const dbURL = import.meta.env.POSTGRES_CONNECTION_STRING;

const sql = postgres(dbURL);

export default sql;
