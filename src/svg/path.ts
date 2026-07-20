export function normalizeSvgPath(candidate: string | null, vaultBasePath?: string): string | null {
	if (!candidate) {
		return null;
	}

	const withoutHash = candidate.split('#')[0] ?? '';
	const withoutQuery = withoutHash.split('?')[0] ?? '';
	const resourcePath = extractResourcePath(withoutQuery);
	const decodedPath = decodePath(resourcePath);

	if (!decodedPath.toLowerCase().endsWith('.svg')) {
		return null;
	}

	return toVaultRelativePath(decodedPath, vaultBasePath);
}

function extractResourcePath(candidate: string): string {
	if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
		return candidate;
	}

	try {
		const url = new URL(candidate);

		if (url.protocol === 'app:' || url.protocol === 'file:') {
			return url.pathname.replace(/^\/([A-Za-z]:\/)/, '$1');
		}
	} catch {
		return candidate;
	}

	return candidate;
}

function decodePath(candidate: string): string {
	try {
		return decodeURIComponent(candidate);
	} catch {
		return candidate;
	}
}

function toVaultRelativePath(candidate: string, vaultBasePath?: string): string {
	const normalizedCandidate = normalizeSlashes(candidate);
	const normalizedBasePath = vaultBasePath ? normalizeSlashes(vaultBasePath).replace(/\/+$/, '') : '';

	if (normalizedBasePath) {
		const candidateForCompare = normalizedCandidate.toLowerCase();
		const baseForCompare = normalizedBasePath.toLowerCase();

		if (candidateForCompare === baseForCompare) {
			return '';
		}

		if (candidateForCompare.startsWith(`${baseForCompare}/`)) {
			return normalizedCandidate.slice(normalizedBasePath.length + 1);
		}
	}

	return normalizedCandidate;
}

function normalizeSlashes(candidate: string): string {
	return candidate.replace(/\\/g, '/');
}
