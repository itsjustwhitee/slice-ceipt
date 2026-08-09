<!-- src/lib/components/SetupStep.svelte -->
<script lang="ts">
	import { tick } from 'svelte';
	import { t } from '$lib/i18n';
	import {
		mode,
		singleModeCount,
		setSingleModeCount,
		isSetupValid,
		isLowConfidenceExtraction,
		confirmSetup
	} from '$lib/stores/receipt';
	import { participants, addParticipant, removeParticipant } from '$lib/stores/participants';
	import { presets, savePreset, deletePreset, applyPreset } from '$lib/stores/presets';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';
	import BookmarkIcon from '$lib/icons/BookmarkIcon.svelte';
	import CheckIcon from '$lib/icons/CheckIcon.svelte';
	import GroupIcon from '$lib/icons/GroupIcon.svelte';
	import SingleIcon from '$lib/icons/SingleIcon.svelte';
	import InfoBanner from './InfoBanner.svelte';

	let newParticipantName = $state('');
	let newPresetName = $state('');
	let participantNameInput = $state<HTMLInputElement | null>(null);

	async function submitAddParticipant() {
		const name = newParticipantName.trim();
		if (!name) return;
		addParticipant(name);
		newParticipantName = '';
		// Adding a participant inserts a new <li> above this input, which on
		// some Android browsers dismisses the on-screen keyboard as a side
		// effect of the DOM mutation/reflow, independent of anything stealing
		// focus directly. Refocusing synchronously (in the same tick as that
		// mutation) isn't enough — the keyboard-dismiss race loses either way.
		// Waiting for Svelte's DOM patch to finish (tick) and then a full
		// paint (requestAnimationFrame) before refocusing gives the browser a
		// settled DOM to focus into, so the next name can be typed without an
		// extra tap.
		await tick();
		requestAnimationFrame(() => participantNameInput?.focus());
	}

	function submitSavePreset() {
		const name = newPresetName.trim();
		if (!name || $participants.length === 0) return;
		savePreset(name, $participants.map((p) => p.name));
		newPresetName = '';
	}
</script>

<div class="card">
	<h1>{$t('setupTitle')}</h1>

	{#if $isLowConfidenceExtraction}
		<InfoBanner text={$t('lowConfidenceWarning')} />
	{/if}

	<div class="mode-tabs" role="tablist">
		<button
			role="tab"
			aria-selected={$mode === 'single'}
			class:is-active={$mode === 'single'}
			onclick={() => mode.set('single')}
		>
			<SingleIcon size={16} />
			{$t('modeSingle')}
		</button>
		<button
			role="tab"
			aria-selected={$mode === 'group'}
			class:is-active={$mode === 'group'}
			onclick={() => mode.set('group')}
		>
			<GroupIcon size={16} />
			{$t('modeGroup')}
		</button>
	</div>
	<div class="mode-panel">
		<p class="hint">{$mode === 'group' ? $t('modeGroupHint') : $t('modeSingleHint')}</p>

		{#if $mode === 'group'}
			<section>
				<h2>{$t('participantsTitle')}</h2>
				<form
					class="inline-form"
					onsubmit={(e) => {
						e.preventDefault();
						submitAddParticipant();
					}}
				>
					<input
						bind:this={participantNameInput}
						type="text"
						placeholder={$t('participantNamePlaceholder')}
						bind:value={newParticipantName}
					/>
					<button
						class="icon-button"
						type="submit"
						aria-label={$t('addParticipant')}
						title={$t('addParticipant')}
					>
						<AddIcon size={16} />
					</button>
				</form>
				<ul class="participant-list">
					{#each $participants as participant (participant.id)}
						<li>
							<span>{participant.name}</span>
							<button
								class="icon-button is-danger"
								aria-label={$t('removeParticipant')}
								title={$t('removeParticipant')}
								onclick={() => removeParticipant(participant.id)}
							>
								<BinIcon size={16} />
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h2>{$t('presetsTitle')}</h2>
				{#if $presets.length > 0}
					<ul class="preset-list">
						{#each $presets as preset (preset.id)}
							<li>
								<span>{preset.name} ({preset.participantNames.join(', ')})</span>
								<div class="preset-actions">
									<button onclick={() => applyPreset(preset.id)}>{$t('applyPreset')}</button>
									<button
										class="icon-button is-danger"
										aria-label={$t('deletePreset')}
										title={$t('deletePreset')}
										onclick={() => deletePreset(preset.id)}
									>
										<BinIcon size={16} />
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
				<form
					class="inline-form"
					onsubmit={(e) => {
						e.preventDefault();
						submitSavePreset();
					}}
				>
					<input type="text" placeholder={$t('presetNamePlaceholder')} bind:value={newPresetName} />
					<button
						class="icon-button"
						type="submit"
						aria-label={$t('savePreset')}
						title={$t('savePreset')}
					>
						<BookmarkIcon size={16} />
					</button>
				</form>
			</section>
		{:else}
			<section class="stepper">
				<button onclick={() => setSingleModeCount($singleModeCount - 1)}>−</button>
				<span class="stepper-value">{$singleModeCount}</span>
				<button onclick={() => setSingleModeCount($singleModeCount + 1)}>+</button>
				<span class="hint">{$t('singleCountLabel')}</span>
			</section>
		{/if}
	</div>

	{#if !$isSetupValid}
		<p class="status-error">{$t('setupNeedMoreParticipants')}</p>
	{/if}
	<button class="continue" disabled={!$isSetupValid} onclick={confirmSetup}>
		<CheckIcon size={16} />
		{$t('setupContinue')}
	</button>
</div>

<style>
	.mode-tabs {
		display: flex;
		gap: 0.25rem;
		margin-top: 1rem;
	}

	.mode-tabs button {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border: none;
		border-radius: 10px 10px 0 0;
		background: color-mix(in srgb, var(--color-text-on-surface) 22%, transparent);
		padding: 0.55em 1em;
		opacity: 0.8;
	}

	.mode-tabs button.is-active {
		opacity: 1;
		background: var(--color-accent);
		color: #1a1a1a;
	}

	.mode-panel {
		background: color-mix(in srgb, var(--color-text-on-surface) 3%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 10%, transparent);
		border-top: 3px solid var(--color-accent);
		border-radius: 0 12px 12px 12px;
		padding: 1rem;
	}

	.hint {
		opacity: 0.75;
		font-size: 0.9rem;
	}

	section {
		margin-top: 1.5rem;
	}

	.participant-list,
	.preset-list {
		list-style: none;
		margin: 0.75rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.participant-list li,
	.preset-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
	}

	.preset-actions {
		display: flex;
		gap: 0.5rem;
	}

	.inline-form {
		display: flex;
		gap: 0.5rem;
	}

	.inline-form input {
		flex: 1;
		font: inherit;
		padding: 0.5em 0.75em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stepper-value {
		font-size: 1.5rem;
		font-weight: 700;
		min-width: 2ch;
		text-align: center;
	}

	.status-error {
		color: var(--color-error);
		font-weight: 600;
	}

	.continue {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		width: 100%;
		line-height: 1;
	}

	.continue:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
