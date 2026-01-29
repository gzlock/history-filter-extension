export function formatRawUrl(raw: string) {
    return raw.replace(/https?:\/\//, '').replace(/\/$/, '');
}
