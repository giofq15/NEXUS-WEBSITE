const { PrismaClient } = require('@prisma/client');
const {
  assertConfigured,
  createCustomer,
  createPayment,
  getPixQrCode,
} = require('../services/asaas.service');
const { isAdminLevel } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

const BILLING_TYPES = ['PIX', 'BOLETO'];
const WEBHOOK_EVENTS_TO_STATUS = {
  PAYMENT_RECEIVED: 'PAGA',
  PAYMENT_CONFIRMED: 'PAGA',
  PAYMENT_OVERDUE: 'ATRASADA',
  PAYMENT_CREATED: 'PENDENTE',
  PAYMENT_UPDATED: 'PENDENTE',
};

function normalizeBillingType(value) {
  const billingType = String(value || 'PIX').toUpperCase();
  return BILLING_TYPES.includes(billingType) ? billingType : 'PIX';
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildTaxaDescription(taxa) {
  const morador = taxa.morador;
  const referencia = `${String(taxa.mes).padStart(2, '0')}/${taxa.ano}`;
  return `${taxa.descricao} - ${referencia} - Bloco ${morador.bloco} / Unidade ${morador.unidade}`;
}

function getWebhookUrl() {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${publicBaseUrl.replace(/\/+$/, '')}/api/pagamentos/asaas/webhook`;
}

function mapChargeRow(row) {
  return {
    ...row,
    pixEncodedImage: row.pixQrCodeImage ?? null,
    pixExpirationDate: row.pixExpirationDate ?? null,
  };
}

async function getConfig(req, res) {
  try {
    assertConfigured();
    res.json({
      provider: 'asaas',
      environment: process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3',
      configured: Boolean(process.env.ASAAS_API_KEY),
      webhookUrl: getWebhookUrl(),
      webhookHeader: 'asaas-access-token',
      billingTypes: BILLING_TYPES,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function listTaxaCharges(req, res) {
  try {
    const isAdmin = isAdminLevel(req.user);
    const moradorId = isAdmin ? Number(req.query.moradorId || 0) || null : req.user.moradorId;
    const hasPixExpirationDateColumn = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1
           FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'taxas'
            AND column_name = 'pix_expiration_date'
       ) AS "exists"`
    );
    const pixExpirationDateSelect = hasPixExpirationDateColumn?.[0]?.exists
      ? `pix_expiration_date AS "pixExpirationDate",`
      : `NULL::timestamp AS "pixExpirationDate",`;

    const baseSelect = `SELECT id, morador_id AS "moradorId", asaas_payment_id AS "asaasPaymentId",
                  asaas_customer_id AS "asaasCustomerId", billing_type AS "billingType",
                  invoice_url AS "invoiceUrl", bank_slip_url AS "bankSlipUrl",
                  pix_payload AS "pixPayload", pix_qr_code_image AS "pixQrCodeImage",
                  ${pixExpirationDateSelect}
                  cobranca_gerada_em AS "cobrancaGeradaEm"
             FROM taxas`;

    const rows = moradorId
      ? await prisma.$queryRawUnsafe(
          `${baseSelect}
            WHERE morador_id = $1
            ORDER BY ano DESC, mes DESC`,
          moradorId
        )
      : await prisma.$queryRawUnsafe(
          `${baseSelect}
            ORDER BY ano DESC, mes DESC`
        );

    res.json(rows.map(mapChargeRow));
  } catch (error) {
    console.error('Erro ao listar cobrancas Asaas:', error);
    res.status(500).json({ error: 'Erro interno ao listar cobrancas' });
  }
}

async function createTaxaCharge(req, res) {
  try {
    assertConfigured();

    const id = Number(req.params.id);
    const billingType = normalizeBillingType(req.body.billingType);
    const customerCpfCnpj = String(req.body.customerCpfCnpj || '').trim();
    const customerEmail = String(req.body.customerEmail || '').trim();
    const customerPhone = String(req.body.customerPhone || '').trim();

    const taxa = await prisma.taxa.findUnique({
      where: { id },
      include: {
        morador: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!taxa) {
      return res.status(404).json({ error: 'Taxa nao encontrada' });
    }

    if (!isAdminLevel(req.user) && taxa.moradorId !== req.user.moradorId) {
      return res.status(403).json({ error: 'Sem permissao para gerar cobranca desta taxa' });
    }

    if (taxa.status === 'PAGA') {
      return res.status(400).json({ error: 'Esta taxa ja esta marcada como paga' });
    }

    const customer = await createCustomer({
      name: taxa.morador.nome,
      cpfCnpj: customerCpfCnpj || taxa.morador.cpf,
      email: customerEmail || taxa.morador.user?.email || undefined,
      mobilePhone: customerPhone || taxa.morador.telefone || undefined,
      externalReference: `morador:${taxa.moradorId}`,
      // No sandbox, desativamos notificacoes para evitar e-mails reais por engano.
      notificationDisabled: true,
    });

    const payment = await createPayment({
      customer: customer.id,
      billingType,
      value: Number(taxa.valor),
      dueDate: req.body.dueDate || formatDate(taxa.vencimento),
      description: buildTaxaDescription(taxa),
      externalReference: `taxa:${taxa.id}`,
    });

    const payload = {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email || null,
      },
      payment: {
        id: payment.id,
        status: payment.status,
        billingType: payment.billingType,
        value: payment.value,
        dueDate: payment.dueDate,
        invoiceUrl: payment.invoiceUrl || null,
        bankSlipUrl: payment.bankSlipUrl || null,
        externalReference: payment.externalReference || null,
      },
      taxa: {
        id: taxa.id,
        status: taxa.status,
        descricao: taxa.descricao,
        valor: Number(taxa.valor),
      },
    };

    if (billingType === 'PIX') {
      try {
        const pixQrCode = await getPixQrCode(payment.id);
        payload.pixQrCode = {
          encodedImage: pixQrCode.encodedImage || null,
          payload: pixQrCode.payload || null,
          expirationDate: pixQrCode.expirationDate || null,
        };
      } catch (pixError) {
        payload.pixQrCode = null;
        payload.pixQrCodeError = pixError.message;
      }
    }

    await prisma.$executeRawUnsafe(
      `UPDATE taxas
          SET asaas_customer_id = $2,
              asaas_payment_id = $3,
              billing_type = $4,
              invoice_url = $5,
              bank_slip_url = $6,
              pix_payload = $7,
              pix_qr_code_image = $8,
              pix_expiration_date = $9,
              cobranca_gerada_em = $10,
              updated_at = NOW()
        WHERE id = $1`,
      taxa.id,
      customer.id,
      payment.id,
      payment.billingType || billingType,
      payment.invoiceUrl || null,
      payment.bankSlipUrl || payment.invoiceUrl || null,
      payload.pixQrCode?.payload || null,
      payload.pixQrCode?.encodedImage || null,
      payload.pixQrCode?.expirationDate ? new Date(payload.pixQrCode.expirationDate) : null,
      new Date()
    );

    payload.taxa = {
      ...payload.taxa,
      asaasPaymentId: payment.id,
      billingType: payment.billingType || billingType,
      invoiceUrl: payment.invoiceUrl || null,
      bankSlipUrl: payment.bankSlipUrl || payment.invoiceUrl || null,
      pixPayload: payload.pixQrCode?.payload || null,
      pixQrCodeImage: payload.pixQrCode?.encodedImage || null,
      pixEncodedImage: payload.pixQrCode?.encodedImage || null,
      pixExpirationDate: payload.pixQrCode?.expirationDate || null,
      cobrancaGeradaEm: new Date(),
    };

    res.status(201).json(payload);
  } catch (error) {
    console.error('Erro ao criar cobranca no Asaas:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro interno ao criar cobranca no Asaas',
      details: error.details || undefined,
    });
  }
}

async function webhook(req, res) {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = req.headers['asaas-access-token'];

    if (webhookToken && receivedToken !== webhookToken) {
      return res.status(401).json({ error: 'Webhook token invalido' });
    }

    const event = String(req.body?.event || '');
    const externalReference = String(req.body?.payment?.externalReference || '');
    const match = externalReference.match(/^taxa:(\d+)$/);

    if (!match) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const taxaId = Number(match[1]);
    const nextStatus = WEBHOOK_EVENTS_TO_STATUS[event];

    if (!nextStatus) {
      return res.status(200).json({ received: true, ignored: true, event });
    }

    const data = { status: nextStatus };
    if (nextStatus === 'PAGA') {
      data.pagoEm = new Date();
    }

    await prisma.taxa.update({
      where: { id: taxaId },
      data,
    });

    res.json({ received: true, taxaId, status: nextStatus, event });
  } catch (error) {
    console.error('Erro ao processar webhook do Asaas:', error);
    res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
}

module.exports = {
  getConfig,
  listTaxaCharges,
  createTaxaCharge,
  webhook,
};
