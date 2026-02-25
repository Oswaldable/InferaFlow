<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Component } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
import ResetPwd from './modules/reset-pwd.vue';
import BindWechat from './modules/bind-wechat.vue';

interface Props {
  module?: UnionKey.LoginModule;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();

interface LoginModule {
  label: string;
  component: Component;
}

const moduleMap: Record<UnionKey.LoginModule, LoginModule> = {
  'pwd-login': { label: loginModuleRecord['pwd-login'], component: PwdLogin },
  'code-login': { label: loginModuleRecord['code-login'], component: CodeLogin },
  register: { label: loginModuleRecord.register, component: Register },
  'reset-pwd': { label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  'bind-wechat': { label: loginModuleRecord['bind-wechat'], component: BindWechat }
};

const activeModule = computed(() => moduleMap[props.module || 'pwd-login']);

// Particle system
const canvasRef = ref<HTMLCanvasElement>();
let animationId: number;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

function initParticles() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = [];
  const particleCount = 50;
  const connectionDistance = 150;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#00d4ff' : '#7c3aed'
    });
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#00d4ff';
          ctx.globalAlpha = (1 - dist / connectionDistance) * 0.15;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(animate);
  }

  animate();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);
}

onMounted(() => {
  initParticles();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
});
</script>

<template>
  <div class="tech-login-page relative size-full flex-center overflow-hidden">
    <!-- Particle Canvas Background -->
    <canvas ref="canvasRef" class="absolute inset-0 z-1" />

    <!-- Grid Background -->
    <div class="tech-grid-bg absolute inset-0 z-0" />

    <!-- Gradient Orbs -->
    <div class="tech-orb tech-orb-1" />
    <div class="tech-orb tech-orb-2" />

    <!-- Login Card -->
    <div class="tech-login-card relative z-10 w-440px lt-sm:w-340px">
      <div class="p-40px lt-sm:p-24px">
        <header class="flex-col items-center gap-16px mb-32px">
          <SystemLogo class="tech-login-logo text-72px lt-sm:text-56px" />
          <h1 class="tech-title text-32px font-bold lt-sm:text-24px">InferaFlow</h1>
          <p class="tech-subtitle text-14px text-#64748b">AI Knowledge Management System</p>
        </header>
        <main>
          <h3 class="text-16px text-#00d4ff font-medium mb-20px">{{ $t(activeModule.label) }}</h3>
          <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
            <component :is="activeModule.component" />
          </Transition>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tech-login-page {
  background: #0a0e1a;
}

.tech-grid-bg {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(0, 212, 255, 0.03) 1px, transparent 0);
  background-size: 30px 30px;
}

.tech-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.tech-orb-1 {
  top: -15%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
}

.tech-orb-2 {
  bottom: -15%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%);
}

.tech-login-card {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 16px;
  box-shadow:
    0 0 40px rgba(0, 0, 0, 0.4),
    0 0 80px rgba(0, 212, 255, 0.05);
  position: relative;
  overflow: hidden;
}

/* Top gradient line */
.tech-login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, #7c3aed, transparent);
}

/* HUD corners */
.tech-login-card::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 20px;
  height: 20px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.4);
  border-right: 2px solid rgba(0, 212, 255, 0.4);
  border-bottom-right-radius: 16px;
  pointer-events: none;
}

.tech-login-logo {
  color: #00d4ff;
  animation: logo-pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5));
}

@keyframes logo-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.3));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(0, 212, 255, 0.6));
    transform: scale(1.02);
  }
}

.tech-title {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.08em;
}

.tech-subtitle {
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 12px;
}
</style>
