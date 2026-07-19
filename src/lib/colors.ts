export const PARTICIPANT_COLORS = [
	'#1c8dd4',
	'#34d7d4',
	'#96de21',
	'#cb2b86',
	'#f8c51f',
	'#911fe2',
	'#d52941',
	'#d52eff',
	'#ff8800',
	'#0008ff'
];

export function participantColor(index: number): string {
	return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
