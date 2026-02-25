<script setup lang="ts">
defineOptions({
  name: 'GlobalFooter'
});
</script>

<template>
  <DarkModeContainer class="h-full flex-center">
    <a
      href="https://github.com/Oswaldable/InferaFlow.git"
      target="_blank"
      rel="noopener noreferrer"
      class="tech-footer-link"
    >
      Copyright MIT &copy; 2025 InferaFlow
    </a>
  </DarkModeContainer>
</template>

<style scoped>
.tech-footer-link {
  color: #475569;
  transition: color 0.3s ease;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.tech-footer-link:hover {
  color: #00d4ff;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
}
</style>
