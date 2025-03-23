
<script>
  import VoicePicker from './VoicePicker.svelte';
  import GenerateButton from './GenerateButton.svelte';

  let selectedModel = null;
  let modelLoaded = false;

  function handleModelSelect(event) {
    selectedModel = event.detail;
    modelLoaded = false; // Reset load state
  }

  function loadModel() {
    if (selectedModel) {
      console.log('Loading model:', selectedModel);
      modelLoaded = true;
      alert('Model loaded successfully!');
    } else {
      alert('Please select a model first.');
    }
  }
</script>

<!-- Model selection -->
<VoicePicker on:select={handleModelSelect} />

<!-- Load button -->
<button class="btn ghost" on:click={loadModel}>Load Model</button>

<!-- Generate button appears only after model is loaded -->
{#if modelLoaded}
  <GenerateButton {selectedModel} />
{/if}
