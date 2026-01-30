export const isDev = process.env.NODE_ENV === 'development';

export function formatRawUrl(raw: string) {
    return raw.replace(/https?:\/\//, '').replace(/\/$/, '');
}
