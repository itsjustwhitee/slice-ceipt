<script lang="ts">
	import { locale, t } from '$lib/i18n';
</script>

<h1>{$t('welcome')}</h1>
<button onclick={() => locale.set('en')}>EN</button>
<button onclick={() => locale.set('it')}>IT</button>
