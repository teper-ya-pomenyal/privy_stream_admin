// Параллельный map с ограничением числа одновременных запросов.
export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function paginate<T>(fetchPage: (offset: number, limit: number) => Promise<T[]>, pageSize = 100, maxItems = 10_000) {
  const all: T[] = [];
  for (let offset = 0; offset < maxItems; offset += pageSize) {
    const page = (await fetchPage(offset, pageSize)) ?? [];
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}
