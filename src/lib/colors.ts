export const PARTICIPANT_COLORS = [
	'#3d5a80',
	'#34d7ac',
	'#96de21',
	'#a82f73',
	'#f8b469',
	'#522b3d',
	'#d52941',
	'#c490d1'
];

export function participantColor(index: number): string {
	return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
