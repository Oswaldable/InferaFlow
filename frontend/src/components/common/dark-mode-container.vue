<script setup lang="ts">
defineOptions({ name: 'DarkModeContainer' });

interface Props {
  inverted?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div
    class="text-base-text transition-300"
    :class="{ 'text-#e2e8f0': !inverted, 'bg-inverted text-#1f1f1f': inverted }"
    :style="{ backgroundColor: inverted ? undefined : 'transparent' }"
  >
    <slot></slot>
  </div>
</template>

<style scoped></style>
