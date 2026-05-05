export interface Document {
    permission: string;
    id: string;
    title: string;
    last_updated: string;
    num_users: number;
}

export interface DocumentPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Document[];
}
