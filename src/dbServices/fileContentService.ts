import { IDBPDatabase, openDB } from 'idb';

interface FileContentDB extends IDBPDatabase {
    fileContent: string;
}

export class FileContentDBService {
    private db: IDBPDatabase<FileContentDB>;

    constructor() {
        this.initDatabase();
    }

    async initDatabase() {
        this.db = await openDB<FileContentDB>('file-content-database', 1, {
            upgrade(db) {
                db.createObjectStore('fileContent');
            },
        });
    }

    async saveFileContentData(data: string) {
        await this.db.put('fileContent', data, 'fileContent');
    }

    async getFileContentData() {
        return this.db.get('fileContent', 'fileContent');
    }

    async deleteFileContentData() {
        await this.db.delete('fileContent', 'fileContent');
    }
}