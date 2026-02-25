<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'GlobalLogo'
});

interface Props {
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>
  <RouterLink to="/" class="w-full flex-center nowrap-hidden">
    <SystemLogo class="tech-logo text-32px text-primary" />
    <h2
      v-show="showTitle"
      class="tech-logo-text pl-8px text-16px font-bold transition duration-300 ease-in-out"
    >
      {{ $t('system.title') }}
    </h2>
  </RouterLink>
</template>

<style scoped>
.tech-logo {
  animation: pulse-glow 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.4));
}

.tech-logo-text {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.8;
    filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.4));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 16px rgba(0, 212, 255, 0.7));
  }
}
</style>
