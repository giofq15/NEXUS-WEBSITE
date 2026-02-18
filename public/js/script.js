document.addEventListener("DOMContentLoaded", function () {
    const dropdownBtn = document.getElementById("dropdown-btn");
    const dropdownMenu = document.getElementById("dropdown-menu");

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener("click", function (event) {
            event.preventDefault();
            dropdownMenu.classList.toggle("show");
        });

        window.addEventListener("click", function (event) {
            if (!event.target.matches("#dropdown-btn") && dropdownMenu.classList.contains("show")) {
                dropdownMenu.classList.remove("show");
            }
        });
    }

    const passwordToggles = document.querySelectorAll(".toggle-password");
    passwordToggles.forEach(function (toggle) {
        toggle.addEventListener("click", function () {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.classList.toggle("fa-eye-slash");
            this.classList.toggle("fa-eye");
        });
    });

    const loginBtn = document.getElementById("login-button-final");
    if (loginBtn) {
        loginBtn.addEventListener("click", function () {
            window.location.href = "../admin/painel-admin.html";
        });
    }
});

(function () {
    document.addEventListener("click", function (e) {
        const openDropdowns = document.querySelectorAll(".dropdown.show");
        openDropdowns.forEach(function (dd) {
            if (!dd.contains(e.target)) {
                dd.classList.remove("show");
            }
        });
    });

    document.addEventListener("click", function (e) {
        const btn = e.target.closest('#dropdown-btn, .cta-button[data-target="dropdown"]');
        if (!btn) {
            return;
        }

        const dropdown = btn.closest(".dropdown");
        if (!dropdown) {
            return;
        }

        dropdown.classList.toggle("show");
        e.stopPropagation();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.key === "Esc") {
            document.querySelectorAll(".dropdown.show").forEach(function (dd) {
                dd.classList.remove("show");
            });
        }
    });
})();

(function () {
    const inadimplenciaTable = document.querySelector("[data-inadimplencia-table]");
    if (!inadimplenciaTable) {
        return;
    }

    const tbody = inadimplenciaTable.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr[data-vencimento]"));
    const totalField = document.querySelector("[data-total-inadimplencia]");
    const quantityField = document.querySelector("[data-qtd-inadimplentes]");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalOverdue = 0;
    let overdueResidents = 0;

    rows.forEach(function (row) {
        const dueDateValue = row.dataset.vencimento;
        const dueDate = new Date(dueDateValue + "T00:00:00");
        const diffInDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        if (!Number.isFinite(diffInDays) || diffInDays <= 30) {
            row.remove();
            return;
        }

        const delayCell = row.querySelector("[data-dias-atraso]");
        if (delayCell) {
            delayCell.textContent = diffInDays + " dias";
        }

        const amount = Number.parseFloat(row.dataset.valor || "0");
        if (Number.isFinite(amount)) {
            totalOverdue += amount;
        }

        overdueResidents += 1;
    });

    if (totalField) {
        totalField.textContent = totalOverdue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    if (quantityField) {
        quantityField.textContent = String(overdueResidents);
    }

    if (!tbody.querySelector("tr")) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = '<td colspan="5">Nao ha moradores com atraso superior a 30 dias no momento.</td>';
        tbody.appendChild(emptyRow);
    }
})();

(function () {
    const STORAGE_KEY = "nexus_comunicados_v1";
    const DRAFT_KEY = "nexus_comunicados_draft_v1";

    const PRIORITY_LABELS = {
        informativo: "Informativo",
        importante: "Importante",
        urgente: "Urgente"
    };

    const PRIORITY_ICONS = {
        informativo: "fa-info-circle",
        importante: "fa-exclamation-circle",
        urgente: "fa-exclamation-triangle"
    };

    const seedData = [
        {
            id: "seed-1",
            titulo: "Interrupcao de energia programada",
            texto: "Sera realizada manutencao na subestacao. A energia sera interrompida em 25/11/2025 das 09h as 12h.",
            prioridade: "urgente",
            status: "publicado",
            publicadoEm: "2025-11-20T09:00:00.000Z",
            atualizadoEm: "2025-11-20T09:00:00.000Z"
        },
        {
            id: "seed-2",
            titulo: "Assembleia geral ordinaria",
            texto: "Assembleia no dia 10/12/2025 no salao de festas. Pauta: prestacao de contas 2025 e previsao orcamentaria 2026.",
            prioridade: "importante",
            status: "publicado",
            publicadoEm: "2025-11-15T12:00:00.000Z",
            atualizadoEm: "2025-11-15T12:00:00.000Z"
        },
        {
            id: "seed-3",
            titulo: "Horarios de uso da piscina",
            texto: "No verao, o horario da piscina passa a ser das 08h as 21h. Exame medico e trajes adequados sao obrigatorios.",
            prioridade: "informativo",
            status: "publicado",
            publicadoEm: "2025-11-01T08:00:00.000Z",
            atualizadoEm: "2025-11-01T08:00:00.000Z"
        }
    ];

    function readJson(key, fallbackValue) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) {
                return fallbackValue;
            }
            const parsed = JSON.parse(raw);
            return parsed || fallbackValue;
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeJson(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function ensureSeed() {
        const current = readJson(STORAGE_KEY, []);
        if (Array.isArray(current) && current.length > 0) {
            return current;
        }
        writeJson(STORAGE_KEY, seedData);
        return seedData.slice();
    }

    function getComunicados() {
        const data = ensureSeed();
        if (!Array.isArray(data)) {
            return [];
        }
        return data.filter(function (item) {
            return item && typeof item === "object";
        });
    }

    function saveComunicados(list) {
        return writeJson(STORAGE_KEY, list);
    }

    function getDraft() {
        const draft = readJson(DRAFT_KEY, null);
        if (!draft || typeof draft !== "object") {
            return null;
        }
        return draft;
    }

    function saveDraft(draft) {
        return writeJson(DRAFT_KEY, draft);
    }

    function clearDraft() {
        try {
            window.localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            return;
        }
    }

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function formatDate(isoValue) {
        const date = new Date(isoValue);
        if (Number.isNaN(date.getTime())) {
            return "Data nao informada";
        }
        return date.toLocaleDateString("pt-BR");
    }

    function formatDateTime(isoValue) {
        const date = new Date(isoValue);
        if (Number.isNaN(date.getTime())) {
            return "Data nao informada";
        }
        return date.toLocaleString("pt-BR");
    }

    function sanitizePriority(priority) {
        if (priority === "urgente" || priority === "importante" || priority === "informativo") {
            return priority;
        }
        return "informativo";
    }

    function buildComunicado(input, status) {
        const nowIso = new Date().toISOString();
        return {
            id: "com-" + Date.now(),
            titulo: String(input.titulo || "").trim(),
            texto: String(input.texto || "").trim(),
            prioridade: sanitizePriority(input.prioridade),
            status: status,
            publicadoEm: status === "publicado" ? nowIso : null,
            atualizadoEm: nowIso
        };
    }

    function initAdminComunicados() {
        const adminRoot = document.querySelector("[data-comunicados-admin]");
        if (!adminRoot) {
            return;
        }

        const form = adminRoot.querySelector("[data-comunicados-form]");
        const inputTitulo = adminRoot.querySelector("[data-comunicado-titulo]");
        const inputPrioridade = adminRoot.querySelector("[data-comunicado-prioridade]");
        const inputTexto = adminRoot.querySelector("[data-comunicado-texto]");
        const feedback = adminRoot.querySelector("[data-comunicados-feedback]");
        const previewBox = adminRoot.querySelector("[data-comunicados-preview]");
        const previewTitulo = adminRoot.querySelector("[data-preview-titulo]");
        const previewMeta = adminRoot.querySelector("[data-preview-meta]");
        const previewTexto = adminRoot.querySelector("[data-preview-texto]");
        const btnPreview = adminRoot.querySelector('[data-comunicados-action="preview"]');
        const btnDraft = adminRoot.querySelector('[data-comunicados-action="draft"]');

        if (!form || !inputTitulo || !inputPrioridade || !inputTexto || !feedback) {
            return;
        }

        ensureSeed();

        function showFeedback(message, type) {
            feedback.textContent = message;
            feedback.classList.remove("is-success", "is-error");
            feedback.classList.add(type === "error" ? "is-error" : "is-success");
        }

        function readFormValues() {
            return {
                titulo: inputTitulo.value,
                prioridade: inputPrioridade.value,
                texto: inputTexto.value
            };
        }

        function validate(values) {
            if (!String(values.titulo || "").trim()) {
                return "Informe um titulo para o comunicado.";
            }
            if (!String(values.texto || "").trim()) {
                return "Informe o conteudo do comunicado.";
            }
            return "";
        }

        function renderPreview(values) {
            if (!previewBox || !previewTitulo || !previewMeta || !previewTexto) {
                return;
            }
            previewTitulo.textContent = values.titulo.trim() || "Sem titulo";
            previewMeta.textContent = PRIORITY_LABELS[sanitizePriority(values.prioridade)] + " â€¢ " + formatDateTime(new Date().toISOString());
            previewTexto.textContent = values.texto.trim() || "Sem conteudo";
            previewBox.hidden = false;
        }

        const savedDraft = getDraft();
        if (savedDraft) {
            inputTitulo.value = savedDraft.titulo || "";
            inputPrioridade.value = sanitizePriority(savedDraft.prioridade || "informativo");
            inputTexto.value = savedDraft.texto || "";
            showFeedback("Rascunho recuperado do navegador.", "success");
        }

        if (btnPreview) {
            btnPreview.addEventListener("click", function () {
                const values = readFormValues();
                const validationError = validate(values);
                if (validationError) {
                    showFeedback(validationError, "error");
                    return;
                }
                renderPreview(values);
                showFeedback("Pre-visualizacao atualizada.", "success");
            });
        }

        if (btnDraft) {
            btnDraft.addEventListener("click", function () {
                const values = readFormValues();
                const validationError = validate(values);
                if (validationError) {
                    showFeedback(validationError, "error");
                    return;
                }

                const draft = buildComunicado(values, "rascunho");
                const ok = saveDraft(draft);
                if (!ok) {
                    showFeedback("Nao foi possivel salvar o rascunho.", "error");
                    return;
                }

                renderPreview(values);
                showFeedback("Rascunho salvo com sucesso.", "success");
            });
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const values = readFormValues();
            const validationError = validate(values);
            if (validationError) {
                showFeedback(validationError, "error");
                return;
            }

            const comunicado = buildComunicado(values, "publicado");
            const list = getComunicados();
            list.push(comunicado);
            const ok = saveComunicados(list);
            if (!ok) {
                showFeedback("Falha ao publicar. Tente novamente.", "error");
                return;
            }

            clearDraft();
            renderPreview(values);
            showFeedback("Comunicado publicado para os moradores.", "success");
        });
    }

    function sortByPublishedDateDesc(list) {
        return list.slice().sort(function (a, b) {
            const dateA = new Date(a.publicadoEm || a.atualizadoEm || 0).getTime();
            const dateB = new Date(b.publicadoEm || b.atualizadoEm || 0).getTime();
            return dateB - dateA;
        });
    }

    function renderMoradorAvisos(filterText) {
        const listRoot = document.querySelector("[data-comunicados-list]");
        const template = document.querySelector("template[data-comunicados-template]");
        if (!listRoot || !template) {
            return;
        }

        const normalizedFilter = normalizeText(filterText);
        const publicados = sortByPublishedDateDesc(getComunicados().filter(function (item) {
            return item.status === "publicado";
        }));

        const filtered = publicados.filter(function (item) {
            if (!normalizedFilter) {
                return true;
            }
            const searchable = normalizeText(item.titulo + " " + item.texto + " " + (PRIORITY_LABELS[item.prioridade] || ""));
            return searchable.includes(normalizedFilter);
        });

        listRoot.innerHTML = "";
        if (filtered.length === 0) {
            const empty = document.createElement("article");
            empty.className = "widget avisos-empty-state";
            empty.textContent = "Nenhum comunicado encontrado para este filtro.";
            listRoot.appendChild(empty);
            return;
        }

        filtered.forEach(function (item) {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".aviso-card");
            const titleEl = clone.querySelector(".aviso-card-title");
            const dateEl = clone.querySelector(".aviso-card-date");
            const bodyEl = clone.querySelector(".aviso-card-body");
            const priorityEl = clone.querySelector(".aviso-prioridade");

            titleEl.textContent = String(item.titulo || "");
            dateEl.textContent = "Publicado em " + formatDate(item.publicadoEm || item.atualizadoEm);
            bodyEl.textContent = String(item.texto || "");

            const priority = sanitizePriority(item.prioridade);
            priorityEl.textContent = PRIORITY_LABELS[priority];
            priorityEl.classList.add("aviso-prioridade-" + priority);

            const iconClass = PRIORITY_ICONS[priority];
            if (iconClass) {
                const icon = document.createElement("i");
                icon.className = "fas " + iconClass;
                priorityEl.prepend(icon);
            }

            card.classList.add("aviso-card-" + priority);
            listRoot.appendChild(clone);
        });
    }

    function initMoradorAvisos() {
        const listRoot = document.querySelector("[data-comunicados-list]");
        if (!listRoot) {
            return;
        }

        ensureSeed();
        const searchInput = document.querySelector("[data-comunicados-search]");

        renderMoradorAvisos("");

        if (searchInput) {
            searchInput.addEventListener("input", function () {
                renderMoradorAvisos(searchInput.value);
            });
        }
    }

    initAdminComunicados();
    initMoradorAvisos();
})();

(function () {
    const STORAGE_KEY = "nexus_moradores_v1";

    const seedMoradores = [
        { id: "mor-1", nome: "Ana Silva", unidade: "101", bloco: "A", status: "ativo", telefone: "(11) 99999-1111", email: "ana.silva@email.com", cpf: "", nascimento: "" },
        { id: "mor-2", nome: "Carlos Pereira", unidade: "205", bloco: "B", status: "ativo", telefone: "(11) 99999-2222", email: "carlos.p@email.com", cpf: "", nascimento: "" },
        { id: "mor-3", nome: "Mariana Costa", unidade: "302", bloco: "A", status: "pendente", telefone: "(11) 99999-3333", email: "mariana.c@email.com", cpf: "", nascimento: "" },
        { id: "mor-4", nome: "Joao Fernandes", unidade: "102", bloco: "A", status: "ativo", telefone: "(11) 99999-4444", email: "joao.f@email.com", cpf: "", nascimento: "" },
        { id: "mor-5", nome: "Beatriz Mendes", unidade: "401", bloco: "C", status: "pendente", telefone: "(11) 99999-5555", email: "beatriz.m@email.com", cpf: "", nascimento: "" },
        { id: "mor-6", nome: "Felipe Castro", unidade: "201", bloco: "B", status: "ativo", telefone: "(11) 99999-6666", email: "felipe.c@email.com", cpf: "", nascimento: "" },
        { id: "mor-7", nome: "Gabriela Lima", unidade: "305", bloco: "C", status: "ativo", telefone: "(11) 99999-7777", email: "gabriela.l@email.com", cpf: "", nascimento: "" },
        { id: "mor-8", nome: "Ricardo Alves", unidade: "501", bloco: "A", status: "pendente", telefone: "(11) 99999-8888", email: "ricardo.a@email.com", cpf: "", nascimento: "" }
    ];

    function readStorage() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function writeStorage(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function ensureSeedMoradores() {
        const current = readStorage();
        if (current.length > 0) {
            return current;
        }
        writeStorage(seedMoradores);
        return seedMoradores.slice();
    }

    function getMoradores() {
        return ensureSeedMoradores().filter(function (item) {
            return item && typeof item === "object" && item.id;
        });
    }

    function saveMoradores(list) {
        return writeStorage(list);
    }

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
    function onlyDigits(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function formatCPF(value) {
        const digits = onlyDigits(value).slice(0, 11);
        const p1 = digits.slice(0, 3);
        const p2 = digits.slice(3, 6);
        const p3 = digits.slice(6, 9);
        const p4 = digits.slice(9, 11);

        if (digits.length <= 3) {
            return p1;
        }
        if (digits.length <= 6) {
            return p1 + "." + p2;
        }
        if (digits.length <= 9) {
            return p1 + "." + p2 + "." + p3;
        }
        return p1 + "." + p2 + "." + p3 + "-" + p4;
    }

    function formatPhone(value) {
        const digits = onlyDigits(value).slice(0, 11);
        const ddd = digits.slice(0, 2);
        const base = digits.slice(2);

        if (digits.length <= 2) {
            return ddd ? "(" + ddd : "";
        }
        if (base.length <= 5) {
            return "(" + ddd + ") " + base;
        }
        if (base.length <= 8) {
            return "(" + ddd + ") " + base.slice(0, 4) + "-" + base.slice(4);
        }
        return "(" + ddd + ") " + base.slice(0, 5) + "-" + base.slice(5);
    }

    function sortMoradoresByName(list) {
        return list.slice().sort(function (a, b) {
            return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" });
        });
    }

    function statusLabel(value) {
        if (value === "pendente") {
            return "Pendente";
        }
        if (value === "bloqueado") {
            return "Bloqueado";
        }
        return "Ativo";
    }

    function statusClass(value) {
        if (value === "pendente") {
            return "status-pendente";
        }
        if (value === "bloqueado") {
            return "status-bloqueado";
        }
        return "status-ativo";
    }

    function buildMoradorFromForm(fields) {
        const nowIso = new Date().toISOString();
        return {
            id: "mor-" + Date.now(),
            nome: String(fields.nome.value || "").trim(),
            cpf: formatCPF(fields.cpf.value || ""),
            nascimento: String(fields.nascimento.value || "").trim(),
            telefone: formatPhone(fields.telefone.value || ""),
            bloco: String(fields.bloco.value || "").trim(),
            unidade: String(fields.unidade.value || "").trim(),
            status: String(fields.status.value || "ativo").trim().toLowerCase(),
            email: String(fields.email.value || "").trim(),
            updatedAt: nowIso
        };
    }

    function initMoradoresList() {
        const page = document.querySelector("[data-moradores-page]");
        if (!page) {
            return;
        }

        const table = page.querySelector("[data-moradores-table]");
        const tbody = table ? table.querySelector("tbody") : null;
        const template = document.querySelector("template[data-moradores-row-template]");
        const searchInput = page.querySelector("[data-moradores-search]");
        const searchMeta = page.querySelector("[data-moradores-search-meta]");
        if (!tbody || !template) {
            return;
        }

        function render(filterValue) {
            const filter = normalizeText(filterValue);
            const moradores = sortMoradoresByName(getMoradores());
            const filtered = moradores.filter(function (morador) {
                if (!filter) {
                    return true;
                }
                const searchable = normalizeText(
                    morador.nome + " " + morador.unidade + " " + morador.bloco + " " + morador.status + " " + morador.email
                );
                return searchable.includes(filter);
            });

            tbody.innerHTML = "";
            if (filtered.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = '<td colspan="4">Nenhum morador encontrado para a busca.</td>';
                tbody.appendChild(row);
            } else {
                filtered.forEach(function (morador) {
                    const clone = template.content.cloneNode(true);
                    const nome = clone.querySelector("[data-col-nome]");
                    const unidade = clone.querySelector("[data-col-unidade]");
                    const status = clone.querySelector("[data-col-status]");
                    const viewLink = clone.querySelector('[data-action="view"]');
                    const editLink = clone.querySelector('[data-action="edit"]');

                    nome.textContent = morador.nome;
                    unidade.textContent = morador.unidade + " - Bloco " + morador.bloco;
                    status.textContent = statusLabel(morador.status);
                    status.className = statusClass(morador.status);
                    viewLink.href = "novo-morador.html?mode=view&id=" + encodeURIComponent(morador.id);
                    editLink.href = "novo-morador.html?mode=edit&id=" + encodeURIComponent(morador.id);
                    tbody.appendChild(clone);
                });
            }

            if (searchMeta) {
                if (filter) {
                    searchMeta.textContent = filtered.length + " morador(es) encontrado(s).";
                } else {
                    searchMeta.textContent = moradores.length + " morador(es) cadastrados.";
                }
            }
        }

        render("");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                render(searchInput.value);
            });
        }
    }

    function initMoradorForm() {
        const page = document.querySelector("[data-morador-form-page]");
        if (!page) {
            return;
        }

        ensureSeedMoradores();

        const form = page.querySelector("[data-morador-form]");
        const title = page.querySelector("[data-morador-form-title]");
        const feedback = page.querySelector("[data-morador-feedback]");
        const submitBtn = page.querySelector("[data-morador-submit]");
        const resetBtn = page.querySelector("[data-morador-reset]");
        const editLink = page.querySelector("[data-morador-edit-link]");
        if (!form || !title || !feedback || !submitBtn || !resetBtn || !editLink) {
            return;
        }

        const fields = {
            nome: form.querySelector('[data-field="nome"]'),
            cpf: form.querySelector('[data-field="cpf"]'),
            nascimento: form.querySelector('[data-field="nascimento"]'),
            telefone: form.querySelector('[data-field="telefone"]'),
            bloco: form.querySelector('[data-field="bloco"]'),
            unidade: form.querySelector('[data-field="unidade"]'),
            status: form.querySelector('[data-field="status"]'),
            email: form.querySelector('[data-field="email"]')
        };

        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode") || "create";
        const moradorId = params.get("id") || "";
        const moradores = sortMoradoresByName(getMoradores());
        const target = moradores.find(function (item) { return item.id === moradorId; }) || null;

        function setFeedback(message, isError) {
            feedback.textContent = message;
            feedback.classList.remove("is-success", "is-error");
            feedback.classList.add(isError ? "is-error" : "is-success");
        }

        function fillForm(morador) {
            fields.nome.value = morador.nome || "";
            fields.cpf.value = formatCPF(morador.cpf || "");
            fields.nascimento.value = morador.nascimento || "";
            fields.telefone.value = formatPhone(morador.telefone || "");
            fields.bloco.value = morador.bloco || "";
            fields.unidade.value = morador.unidade || "";
            fields.status.value = morador.status || "ativo";
            fields.email.value = morador.email || "";
        }

        function setReadOnly(readOnly) {
            Object.keys(fields).forEach(function (key) {
                fields[key].disabled = readOnly;
            });
        }

        function bindInputMasks() {
            if (fields.cpf) {
                fields.cpf.addEventListener("input", function () {
                    fields.cpf.value = formatCPF(fields.cpf.value);
                });
            }
            if (fields.telefone) {
                fields.telefone.addEventListener("input", function () {
                    fields.telefone.value = formatPhone(fields.telefone.value);
                });
            }
        }

        function validateDuplicateUnit(nextMorador) {
            const conflict = getMoradores().find(function (item) {
                if (item.id === (target ? target.id : "")) {
                    return false;
                }
                return normalizeText(item.unidade) === normalizeText(nextMorador.unidade)
                    && normalizeText(item.bloco) === normalizeText(nextMorador.bloco);
            });
            return !conflict;
        }

        if ((mode === "edit" || mode === "view") && !target) {
            setReadOnly(true);
            submitBtn.hidden = true;
            resetBtn.hidden = true;
            title.textContent = "Morador nÃ£o encontrado";
            setFeedback("NÃ£o foi possÃ­vel localizar o morador solicitado.", true);
            return;
        }

        if (mode === "view") {
            fillForm(target);
            setReadOnly(true);
            title.textContent = "Visualizar Morador";
            submitBtn.hidden = true;
            resetBtn.hidden = true;
            editLink.hidden = false;
            editLink.href = "novo-morador.html?mode=edit&id=" + encodeURIComponent(target.id);
        } else if (mode === "edit") {
            fillForm(target);
            title.textContent = "Editar Morador";
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar AlteraÃ§Ãµes';
            setFeedback("Edite os campos e salve as alteraÃ§Ãµes.", false);
        } else {
            title.textContent = "Cadastro de Novo Morador";
        }
        bindInputMasks();
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const payload = buildMoradorFromForm(fields);
            if (!payload.nome || !payload.telefone || !payload.bloco || !payload.unidade || !payload.email) {
                setFeedback("Preencha os campos obrigatÃ³rios para continuar.", true);
                return;
            }
            const cpfDigits = onlyDigits(payload.cpf);
            const phoneDigits = onlyDigits(payload.telefone);
            if (cpfDigits && cpfDigits.length !== 11) {
                setFeedback("CPF invalido. Informe 11 digitos.", true);
                return;
            }
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                setFeedback("Telefone invalido. Use DDD + numero.", true);
                return;
            }

            if (!validateDuplicateUnit(payload)) {
                setFeedback("JÃ¡ existe um morador cadastrado nesta unidade/bloco.", true);
                return;
            }

            const list = getMoradores();
            if (mode === "edit" && target) {
                const index = list.findIndex(function (item) { return item.id === target.id; });
                if (index === -1) {
                    setFeedback("Morador nÃ£o encontrado para ediÃ§Ã£o.", true);
                    return;
                }
                list[index] = Object.assign({}, target, payload, { id: target.id });
            } else {
                list.push(payload);
            }

            if (!saveMoradores(list)) {
                setFeedback("NÃ£o foi possÃ­vel salvar os dados no navegador.", true);
                return;
            }

            window.location.href = "moradores.html";
        });
    }

    initMoradoresList();
    initMoradorForm();
})();



(function () {
    const STORAGE_KEY = "nexus_ocorrencias_v1";

    function readJson(key, fallbackValue) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) {
                return fallbackValue;
            }
            const parsed = JSON.parse(raw);
            return parsed || fallbackValue;
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeJson(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function normalizeStatus(value) {
        const clean = String(value || "").toLowerCase();
        if (clean.includes("resol")) {
            return "RESOLVIDA";
        }
        if (clean.includes("andamento")) {
            return "EM_ANDAMENTO";
        }
        return "EM_ANALISE";
    }

    function statusLabel(status) {
        if (status === "RESOLVIDA") {
            return "Resolvida";
        }
        if (status === "EM_ANDAMENTO") {
            return "Em Andamento";
        }
        return "Em Análise";
    }

    function statusClass(status) {
        if (status === "RESOLVIDA") {
            return "status-resolvida";
        }
        if (status === "EM_ANDAMENTO") {
            return "status-andamento";
        }
        return "status-pendente";
    }

    function inferPriority(tipo) {
        const t = String(tipo || "").toLowerCase();
        if (t.includes("segurança") || t.includes("estrutural") || t.includes("elevador")) {
            return "Alta";
        }
        if (t.includes("ruído") || t.includes("ruido") || t.includes("financeiro")) {
            return "Média";
        }
        return "Baixa";
    }

    function priorityClass(priority) {
        const p = String(priority || "").toLowerCase();
        if (p.includes("alta")) {
            return "status-alta";
        }
        if (p.includes("média") || p.includes("media")) {
            return "status-media";
        }
        return "status-baixa";
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return String(dateValue || "");
        }
        return date.toLocaleDateString("pt-BR");
    }

    function parseId(text) {
        const value = parseInt(String(text || "").replace("#", ""), 10);
        return Number.isFinite(value) ? value : null;
    }

    function parseMoradorRows(body) {
        return Array.from(body.querySelectorAll("tr")).map(function (row) {
            const cells = row.querySelectorAll("td");
            if (cells.length < 5) {
                return null;
            }
            const id = parseId(cells[0].textContent);
            if (!id) {
                return null;
            }
            const tipo = cells[1].textContent.trim();
            const local = cells[2].textContent.trim();
            const dataAbertura = cells[3].textContent.trim();
            const status = normalizeStatus(cells[4].textContent);

            return {
                id: id,
                tipo: tipo,
                local: local,
                unidade: "Unidade não informada",
                prioridade: inferPriority(tipo),
                status: status,
                dataAbertura: dataAbertura,
                descricao: tipo + " - " + local
            };
        }).filter(Boolean);
    }

    function parseAdminRows(body) {
        return Array.from(body.querySelectorAll("tr")).map(function (row) {
            const cells = row.querySelectorAll("td");
            if (cells.length < 6) {
                return null;
            }
            const id = parseId(cells[0].textContent);
            if (!id) {
                return null;
            }
            const assunto = cells[1].textContent.trim();
            const unidade = cells[2].textContent.trim();
            const prioridade = cells[3].textContent.trim() || "Média";
            const status = normalizeStatus(cells[4].textContent);
            const dataAbertura = cells[5].textContent.trim();

            return {
                id: id,
                tipo: assunto,
                local: assunto,
                unidade: unidade,
                prioridade: prioridade,
                status: status,
                dataAbertura: dataAbertura,
                descricao: assunto
            };
        }).filter(Boolean);
    }

    function ensureSeed(moradorBody, adminBody) {
        const current = readJson(STORAGE_KEY, []);
        if (Array.isArray(current) && current.length > 0) {
            return current;
        }

        let seeded = [];
        if (moradorBody) {
            seeded = parseMoradorRows(moradorBody);
        } else if (adminBody) {
            seeded = parseAdminRows(adminBody);
        }

        if (!seeded.length) {
            seeded = [
                {
                    id: 45,
                    tipo: "Estrutural / Manutenção",
                    local: "Elevador do Bloco B",
                    unidade: "405 - Bloco B",
                    prioridade: "Alta",
                    status: "EM_ANALISE",
                    dataAbertura: "18/10/2025",
                    descricao: "Vazamento no elevador"
                }
            ];
        }

        writeJson(STORAGE_KEY, seeded);
        return seeded;
    }

    function getOcorrencias() {
        const data = readJson(STORAGE_KEY, []);
        if (!Array.isArray(data)) {
            return [];
        }
        return data.filter(function (item) {
            return item && typeof item === "object";
        });
    }

    function saveOcorrencias(list) {
        writeJson(STORAGE_KEY, list);
    }

    function renderMoradorTable(body) {
        const list = getOcorrencias().sort(function (a, b) {
            return (b.id || 0) - (a.id || 0);
        });

        body.innerHTML = list.map(function (item) {
            return `
                <tr>
                    <td>#${String(item.id).padStart(4, "0")}</td>
                    <td>${item.tipo || "Ocorrência"}</td>
                    <td>${item.local || "Não informado"}</td>
                    <td>${item.dataAbertura || "-"}</td>
                    <td class="${statusClass(item.status)}">${statusLabel(item.status)}</td>
                    <td>
                        <a href="detalhes-ocorrencia-morador.html" class="action-link"><i class="fas fa-eye"></i> Detalhes</a>
                        <a href="detalhes-ocorrencia-morador.html?acao=responder" class="action-link" style="color: #e67e22;"><i class="fas fa-reply"></i> Responder</a>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function renderAdminTable(body, searchValue) {
        const query = String(searchValue || "").toLowerCase();
        const list = getOcorrencias()
            .sort(function (a, b) {
                return (b.id || 0) - (a.id || 0);
            })
            .filter(function (item) {
                if (!query) return true;
                const haystack = [item.descricao, item.tipo, item.local, item.unidade]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(query);
            });

        body.innerHTML = list.map(function (item) {
            const assunto = item.descricao || item.tipo || "Ocorrência";
            const prioridade = item.prioridade || inferPriority(item.tipo);
            return `
                <tr>
                    <td>#${String(item.id).padStart(4, "0")}</td>
                    <td>${assunto}</td>
                    <td>${item.unidade || "Unidade não informada"}</td>
                    <td class="${priorityClass(prioridade)}">${prioridade}</td>
                    <td class="${statusClass(item.status)}">${statusLabel(item.status)}</td>
                    <td>${item.dataAbertura || "-"}</td>
                    <td><a href="detalhes-ocorrencia.html" class="action-link">Ver Detalhes</a></td>
                </tr>
            `;
        }).join("");
    }

    function initMoradorOcorrencias() {
        const form = document.querySelector("[data-ocorrencias-form]");
        const body = document.querySelector("[data-ocorrencias-morador-body]");
        if (!form || !body) {
            return;
        }

        ensureSeed(body, null);
        renderMoradorTable(body);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const tipo = document.getElementById("tipo").value || "Ocorrência";
            const local = document.getElementById("local").value || "Não informado";
            const descricao = document.getElementById("descricao").value || tipo;

            const current = getOcorrencias();
            const maxId = current.reduce(function (acc, item) {
                return Math.max(acc, Number(item.id) || 0);
            }, 0);

            current.push({
                id: maxId + 1,
                tipo: tipo,
                local: local,
                unidade: "405 - Bloco B",
                prioridade: inferPriority(tipo),
                status: "EM_ANALISE",
                dataAbertura: formatDate(new Date().toISOString()),
                descricao: descricao
            });

            saveOcorrencias(current);
            renderMoradorTable(body);
            form.reset();
            alert(`Ocorrência #${String(maxId + 1).padStart(4, "0")} criada com sucesso.`);
        });
    }

    function initAdminOcorrencias() {
        const body = document.querySelector("[data-ocorrencias-admin-body]");
        if (!body) {
            return;
        }

        const searchInput = document.querySelector("[data-ocorrencias-admin-search]");
        ensureSeed(null, body);
        renderAdminTable(body, "");

        if (searchInput) {
            searchInput.addEventListener("input", function () {
                renderAdminTable(body, searchInput.value);
            });
        }

        window.addEventListener("storage", function (event) {
            if (event.key === STORAGE_KEY) {
                renderAdminTable(body, searchInput ? searchInput.value : "");
            }
        });
    }

    initMoradorOcorrencias();
    initAdminOcorrencias();
})();
