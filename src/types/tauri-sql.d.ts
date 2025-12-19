/**
 * Tauri SQL Plugin Type Declarations
 * 
 * Basic types for tauri-plugin-sql-api until official types are available.
 */

declare module 'tauri-plugin-sql-api' {
  export default class Database {
    static load(uri: string): Promise<Database>
    
    execute(query: string, bindValues?: any[]): Promise<{ rowsAffected: number }>
    
    select<T = any>(query: string, bindValues?: any[]): Promise<T>
  }
}
