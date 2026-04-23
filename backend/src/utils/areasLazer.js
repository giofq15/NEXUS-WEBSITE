function normalizeAreaName(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isAreaReservavel(areaOrNome) {
  const nome = typeof areaOrNome === 'string' ? areaOrNome : areaOrNome?.nome;
  const nomeNormalizado = normalizeAreaName(nome);

  return nomeNormalizado === 'salao de festas' || nomeNormalizado.startsWith('churrasqueira');
}

function getAreasReservaveisWhere() {
  return {
    OR: [
      { nome: { equals: 'Salão de Festas', mode: 'insensitive' } },
      { nome: { equals: 'Salao de Festas', mode: 'insensitive' } },
      { nome: { startsWith: 'Churrasqueira', mode: 'insensitive' } },
    ],
  };
}

module.exports = {
  isAreaReservavel,
  getAreasReservaveisWhere,
};
