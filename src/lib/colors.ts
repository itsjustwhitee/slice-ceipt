export const PARTICIPANT_COLORS = [
	'#4ea8de',
	'#2ec4b6',
	'#40916c',
	'#9d4edd',
	'#f15bb5',
	'#5c7cfa',
	'#e5626e',
	'#a5713f'
];

export function participantColor(index: number): string {
	return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
