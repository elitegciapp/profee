import { useMemo } from 'react';

export function useColorScheme() {
	return useMemo(() => 'dark' as const, []);
}
