export interface ICategory {
    id: number;
    channel_id: number;
    name: string;
    path: string;
    latest_item_index?: number;
    saved_item_index?: number;
    status: boolean;
    description?: string;
}
