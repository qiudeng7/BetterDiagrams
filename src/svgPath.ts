export function normalizeSvgPath(candidate: string | null): string | null {
	if (!candidate) {
		return null;
	}

	const withoutHash = candidate.split('#')[0] ?? '';
	const withoutQuery = withoutHash.split('?')[0] ?? '';

	if (!withoutQuery.toLowerCase().endsWith('.svg')) {
		return null;
	}

	try {
		return decodeURIComponent(withoutQuery);
	} catch {
		return withoutQuery;
	}
}
