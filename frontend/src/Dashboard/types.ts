export interface Document {
    access: string;
    authors: string[];
    id: string;
    title: string;
    updated_at: string;
    num_users: number;
}

export interface DocumentPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Document[];
}
