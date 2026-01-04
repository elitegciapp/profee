import { useMemo } from 'react';

import { useTheme } from '@/src/context/ThemeContext';

export function useColorScheme() {
	const { colorScheme } = useTheme();
	return useMemo(() => colorScheme, [colorScheme]);
}
