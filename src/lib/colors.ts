export const PARTICIPANT_COLORS = [
	'#1c94de',
	'#2daaa8',
	'#7dae30',
	'#cb2b86',
	'#b8941e',
	'#a13ee8',
	'#d52941',
	'#ee2eff',
	'#ff8800',
	'#4046ee',
	'#52909e',
	'#2daaa8',
	'#469a40',
	'#ad5b8a',
	'#5f532c',
	'#7334a1',
	'#ae2121',
	'#ff4000',
	'#487783'
];

export function participantColor(index: number): string {
	return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
