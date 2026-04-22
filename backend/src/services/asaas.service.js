const ASAAS_API_URL = (process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3').replace(/\/+$/, '');
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

function assertConfigured() {
  if (!ASAAS_API_KEY) {
    const error = new Error('ASAAS_API_KEY nao configurada no backend/.env');
    error.statusCode = 500;
    throw error;
  }
}

async function request(path, options = {}) {
  assertConfigured();

  if (typeof fetch !== 'function') {
    const error = new Error('Fetch nao esta disponivel nesta versao do Node.js');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${ASAAS_API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      accept: 'application/json',
      access_token: ASAAS_API_KEY,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data && data.errors && data.errors[0] && data.errors[0].description)
      || data.message
      || `Erro Asaas (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

async function createCustomer(input) {
  const payload = {
    name: input.name,
    cpfCnpj: onlyDigits(input.cpfCnpj),
    email: input.email || undefined,
    mobilePhone: onlyDigits(input.mobilePhone) || undefined,
    externalReference: input.externalReference || undefined,
    notificationDisabled: input.notificationDisabled !== false,
  };

  return request('/customers', {
    method: 'POST',
    body: payload,
  });
}

async function createPayment(input) {
  return request('/payments', {
    method: 'POST',
    body: {
      customer: input.customer,
      billingType: input.billingType,
      value: Number(input.value),
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
    },
  });
}

async function getPixQrCode(paymentId) {
  return request(`/payments/${paymentId}/pixQrCode`);
}

module.exports = {
  assertConfigured,
  createCustomer,
  createPayment,
  getPixQrCode,
};
