<!-- src/lib/components/SetupStep.svelte -->
<script lang="ts">
	import { tick } from 'svelte';
	import { t } from '$lib/i18n';
	import { mode, singleModeCount, setSingleModeCount, isSetupValid, confirmSetup } from '$lib/stores/receipt';
	import { participants, addParticipant, removeParticipant } from '$lib/stores/participants';
	import { presets, savePreset, deletePreset, applyPreset } from '$lib/stores/presets';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';

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

	<div class="mode-toggle">
		<button class:is-active={$mode === 'group'} onclick={() => mode.set('group')}>
			{$t('modeGroup')}
		</button>
		<button class:is-active={$mode === 'single'} onclick={() => mode.set('single')}>
			{$t('modeSingle')}
		</button>
	</div>
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
					onpointerdown={(e) => e.preventDefault()}
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
				<button type="submit">{$t('savePreset')}</button>
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

	{#if !$isSetupValid}
		<p class="status-error">{$t('setupNeedMoreParticipants')}</p>
	{/if}
	<button class="continue" disabled={!$isSetupValid} onclick={confirmSetup}>
		{$t('setupContinue')}
	</button>
</div>

<style>
	.mode-toggle {
		display: flex;
		gap: 0.75rem;
		margin: 1rem 0 0.5rem;
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
		margin-top: 1.5rem;
		width: 100%;
	}

	.continue:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
