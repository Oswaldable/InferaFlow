<script setup lang="ts">
import { computed, reactive } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: 'admin',
  password: 'admin123'
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login(model.userName, model.password);
}

type AccountKey = 'admin' | 'user';

interface Account {
  key: AccountKey;
  label: string;
  userName: string;
  password: string;
}

const accounts = computed<Account[]>(() => [
  {
    key: 'admin',
    label: $t('page.login.pwdLogin.admin'),
    userName: 'admin',
    password: 'admin123'
  },
  {
    key: 'user',
    label: $t('page.login.pwdLogin.user'),
    userName: 'testuser',
    password: 'test123'
  }
]);

function handleAccountLogin(account: Account) {
  model.userName = account.userName;
  model.password = account.password;
  handleSubmit();
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="userName">
      <NInput v-model:value="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')">
        <template #prefix>
          <icon-ant-design:user-outlined class="text-#64748b" />
        </template>
      </NInput>
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      >
        <template #prefix>
          <icon-ant-design:key-outlined class="text-#64748b" />
        </template>
      </NInput>
    </NFormItem>
    <div class="flex-col gap-16px">
      <NButton
        type="primary"
        size="large"
        round
        block
        :loading="authStore.loginLoading"
        class="tech-login-btn"
        @click="handleSubmit"
      >
        {{ $t('page.login.common.login') }}
      </NButton>
      <NButton block round class="tech-register-btn" @click="toggleLoginModule('register')">
        {{ $t(loginModuleRecord.register) }}
      </NButton>

      <span class="text-center text-#64748b text-13px">
        登录即代表已阅读并同意我们的
        <NButton text type="primary" class="text-#00d4ff">用户协议</NButton>
        和
        <NButton text type="primary" class="text-#00d4ff">隐私政策</NButton>
      </span>

      <NDivider class="text-12px text-#475569 !m-0">{{ $t('page.login.pwdLogin.otherAccountLogin') }}</NDivider>
      <div class="flex-center gap-12px">
        <NButton
          v-for="item in accounts"
          :key="item.key"
          type="primary"
          round
          class="tech-account-btn"
          @click="handleAccountLogin(item)"
        >
          {{ item.label }}
        </NButton>
      </div>
    </div>
  </NForm>
</template>

<style scoped>
.tech-login-btn {
  background: linear-gradient(135deg, #00d4ff, #7c3aed) !important;
  border: none !important;
  font-weight: 600;
  letter-spacing: 0.05em;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tech-login-btn:hover {
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.2);
  transform: translateY(-1px);
}

.tech-register-btn {
  background: transparent !important;
  border: 1px solid rgba(0, 212, 255, 0.25) !important;
  color: #00d4ff !important;
  transition: all 0.3s ease;
}

.tech-register-btn:hover {
  background: rgba(0, 212, 255, 0.08) !important;
  border-color: rgba(0, 212, 255, 0.5) !important;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.15);
}

.tech-account-btn {
  background: rgba(0, 212, 255, 0.1) !important;
  border: 1px solid rgba(0, 212, 255, 0.2) !important;
  color: #00d4ff !important;
  transition: all 0.3s ease;
}

.tech-account-btn:hover {
  background: rgba(0, 212, 255, 0.2) !important;
  border-color: rgba(0, 212, 255, 0.4) !important;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}
</style>
