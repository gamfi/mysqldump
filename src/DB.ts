import { Connection, createConnection, ConnectionOptions } from 'mysql2/promise';

const pool: Array<DB> = [];

class DB {
    private readonly connection: Connection;

    // can only instantiate via DB.connect method
    private constructor(connection: Connection) {
        this.connection = connection;
    }

    public static async connect(options: ConnectionOptions): Promise<DB> {
        const instance = new DB(await createConnection(options));
        pool.push(instance);

        return instance;
    }

    public async query<T>(sql: string): Promise<Array<T>> {
        const res = await this.connection.query<any>(sql);

        return res[0];
    }
    public async multiQuery<T>(sql: string): Promise<Array<Array<T>>> {
        let isMulti = true;
        if (sql.split(';').length === 2) {
            isMulti = false;
        }

        let res = (await this.connection.query<Array<any>>(sql))[0];
        if (!isMulti) {
            // mysql will return a non-array payload if there's only one statement in the query
            // so standardise the res..
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            res = [res] as any;
        }

        return res;
    }

    public async end(): Promise<void> {
        await this.connection.end().catch(() => {});
    }

    public static async cleanup(): Promise<void> {
        await Promise.all(
            pool.map(async p => {
                await p.end();
            }),
        );
    }
}

export { DB };
