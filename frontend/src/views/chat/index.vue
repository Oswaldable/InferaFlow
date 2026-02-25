<script setup lang="ts">
import ChatList from './modules/chat-list.vue';
import InputBox from './modules/input-box.vue';

const chatStore = useChatStore();
const { wsStatus, list } = storeToRefs(chatStore);

const statusLabel = computed(() => {
  if (wsStatus.value === 'OPEN') return 'ONLINE';
  if (wsStatus.value === 'CONNECTING') return 'SYNCING';
  return 'OFFLINE';
});

const statusClass = computed(() => {
  if (wsStatus.value === 'OPEN') return 'is-online';
  if (wsStatus.value === 'CONNECTING') return 'is-syncing';
  return 'is-offline';
});

const userMessages = computed(() => list.value.filter(item => item.role === 'user').length);
const assistantMessages = computed(() => list.value.filter(item => item.role === 'assistant').length);
</script>

<template>
  <div class="tech-chat-page">
    <div class="tech-ambient-layer">
      <span class="tech-orb orb-cyan" />
      <span class="tech-orb orb-amber" />
      <span class="tech-grid-mask" />
    </div>

    <header class="tech-dashboard">
      <div class="dashboard-title-wrap">
        <p class="dashboard-kicker">InferaFlow Neural Console</p>
        <h2 class="dashboard-title">Knowledge Chat Matrix</h2>
      </div>
      <div class="dashboard-metrics">
        <div class="metric-card">
          <span class="metric-label">USER MSG</span>
          <strong class="metric-value">{{ userMessages }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">AI MSG</span>
          <strong class="metric-value">{{ assistantMessages }}</strong>
        </div>
        <div class="metric-card status-card" :class="statusClass">
          <span class="metric-label">CHANNEL</span>
          <div class="status-chip">
            <span class="status-dot" />
            <strong class="metric-value">{{ statusLabel }}</strong>
          </div>
        </div>
      </div>
    </header>

    <section class="tech-chat-shell">
      <ChatList />
      <InputBox />
    </section>
  </div>
</template>

<style scoped>
.tech-chat-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow: hidden;
  font-family: 'Space Grotesk', 'Avenir Next Condensed', 'PingFang SC', sans-serif;
}

.tech-ambient-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.tech-orb {
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.3;
  animation: float-orb 14s ease-in-out infinite;
}

.orb-cyan {
  top: -80px;
  right: -60px;
  background: #2dd4bf;
}

.orb-amber {
  bottom: -120px;
  left: -50px;
  background: #f59e0b;
  animation-delay: -5s;
}

.tech-grid-mask {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(45, 212, 191, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 212, 191, 0.05) 1px, transparent 1px);
  background-size: 26px 26px;
  opacity: 0.35;
}

.tech-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(94, 234, 212, 0.25);
  background: linear-gradient(135deg, rgba(6, 12, 24, 0.78), rgba(12, 22, 40, 0.7));
  box-shadow: 0 12px 40px rgba(2, 8, 23, 0.35);
  backdrop-filter: blur(16px);
}

.dashboard-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: rgba(148, 163, 184, 0.9);
}

.dashboard-title {
  margin: 6px 0 0;
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #e2f6f1;
  text-shadow: 0 0 20px rgba(45, 212, 191, 0.26);
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(84px, 120px));
  gap: 10px;
}

.metric-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.62);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.86);
  letter-spacing: 0.12em;
}

.metric-value {
  font-size: 18px;
  line-height: 1.1;
  color: #f8fafc;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.9);
}

.status-card.is-online {
  border-color: rgba(52, 211, 153, 0.5);
}

.status-card.is-online .status-dot {
  background: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.85);
}

.status-card.is-syncing {
  border-color: rgba(245, 158, 11, 0.45);
}

.status-card.is-syncing .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.75);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.status-card.is-offline {
  border-color: rgba(248, 113, 113, 0.45);
}

.status-card.is-offline .status-dot {
  background: #f87171;
  box-shadow: 0 0 10px rgba(248, 113, 113, 0.75);
}

.tech-chat-shell {
  position: relative;
  z-index: 1;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 22px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: linear-gradient(160deg, rgba(10, 15, 28, 0.8), rgba(12, 19, 35, 0.62));
  box-shadow: 0 16px 42px rgba(2, 6, 23, 0.42);
  padding: 14px;
}

@media (max-width: 960px) {
  .tech-chat-page {
    padding: 10px;
    gap: 10px;
  }

  .tech-dashboard {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .dashboard-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tech-chat-shell {
    padding: 10px;
  }
}

@media (max-width: 640px) {
  .dashboard-title {
    font-size: 20px;
  }

  .metric-card {
    padding: 9px 10px;
  }

  .metric-value {
    font-size: 15px;
  }
}

@keyframes float-orb {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -18px, 0);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
