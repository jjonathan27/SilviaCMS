// --- 1. Inicialización y Auth ---
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('cms_session'));
    if (!session || !session.isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userRoleDisplay').innerText = `${session.email} (${session.role})`;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('cms_session');
        window.location.href = 'index.html';
    });

    initDataStore();
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    setupEventListeners();
});

// --- 2. Persistencia de Datos (LocalStorage) ---
const initDataStore = () => {
    const defaultData = {
        pages: [{ id: 1, title: 'Inicio', slug: '/home', status: 'Publicado' }],
        users: [{ id: 1, name: 'Admin Principal', email: 'admin@cmspro.com', role: 'Admin' }],
        sections: [{ id: 1, name: 'Banner Principal', isVisible: true }]
    };
    if (!localStorage.getItem('cms_data')) {
        localStorage.setItem('cms_data', JSON.stringify(defaultData));
    }
};

const getDB = () => JSON.parse(localStorage.getItem('cms_data'));
const saveDB = (data) => localStorage.setItem('cms_data', JSON.stringify(data));

// --- 3. UI Heuristics (Toasts, Modales Globales) ---
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-red-500/10 border-red-500 text-red-400';
    
    toast.className = `p-4 rounded-lg border shadow-lg backdrop-blur-md flex items-center toast-enter ${colors}`;
    toast.innerHTML = `<span class="mr-2">${type === 'success' ? '✓' : '⚠'}</span> ${message}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).close();
};

let currentConfirmCallback = null;
const confirmAction = (callback) => {
    currentConfirmCallback = callback;
    document.getElementById('confirmModal').showModal();
};

document.getElementById('cancelModalBtn').addEventListener('click', () => {
    document.getElementById('confirmModal').close();
    currentConfirmCallback = null;
});

document.getElementById('confirmModalBtn').addEventListener('click', () => {
    if (currentConfirmCallback) currentConfirmCallback();
    document.getElementById('confirmModal').close();
});

// --- 4. Enrutamiento SPA ---
const appContainer = document.getElementById('app');
const titleContainer = document.getElementById('moduleTitle');

const handleRouting = () => {
    const hash = window.location.hash || '#pages';
    
    // Limpiar contenedor para evitar sobreposición
    appContainer.innerHTML = '';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-slate-700', 'text-white');
        if (link.getAttribute('href') === hash) link.classList.add('bg-slate-700', 'text-white');
    });

    switch (hash) {
        case '#pages': renderPages(); break;
        case '#users': renderUsers(); break;
        case '#sections': renderSections(); break;
        default: renderPages();
    }
};

// --- 5. Módulo: Páginas ---
const renderPages = () => {
    titleContainer.innerText = 'Gestión de Páginas';
    const db = getDB();
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl text-white font-bold">Listado de Páginas</h2>
            <button onclick="openPageModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-base font-medium">
                + Nueva Página
            </button>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-sm">
            <table class="w-full text-left text-base text-white">
                <thead class="bg-slate-900 border-b border-slate-600 text-white uppercase text-sm font-bold">
                    <tr><th class="px-6 py-5">Título</th><th class="px-6 py-5">Ruta (Slug)</th><th class="px-6 py-5">Estado</th><th class="px-6 py-5 text-right">Acciones</th></tr>
                </thead>
                <tbody>
                    ${db.pages.map(p => `
                        <tr class="border-b border-slate-600 hover:bg-slate-700 transition-colors">
                            <td class="px-6 py-5 font-bold text-white text-lg">${p.title}</td>
                            <td class="px-6 py-5 text-white text-lg">${p.slug}</td>
                            <td class="px-6 py-5">
                                <span class="badge-oval ${p.status === 'Publicado' ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}">
                                    ${p.status}
                                </span>
                            </td>
                            <td class="px-6 py-5 text-right space-x-3">
                                <button onclick="openPreview(${p.id})" class="bg-indigo-700 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors">Ver</button>
                                <button onclick="openPageModal(${p.id})" class="bg-blue-700 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors">Editar</button>
                                <button onclick="deleteRecord('pages', ${p.id})" class="bg-red-700 text-white px-4 py-2 rounded font-semibold hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-400 transition-colors">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                    ${db.pages.length === 0 ? `<tr><td colspan="4" class="px-6 py-8 text-center text-white">No hay páginas creadas.</td></tr>` : ''}
                </tbody>
            </table>
        </div>
    `;
    appContainer.innerHTML = html;
};

window.openPageModal = (id = null) => {
    const db = getDB();
    const modal = document.getElementById('pageModal');
    const form = document.getElementById('pageForm');
    
    if (id) {
        const page = db.pages.find(p => p.id === id);
        document.getElementById('pageModalTitle').innerText = 'Editar Página';
        document.getElementById('pageId').value = page.id;
        document.getElementById('pageTitle').value = page.title;
        document.getElementById('pageSlug').value = page.slug;
        document.getElementById('pageStatus').value = page.status;
    } else {
        document.getElementById('pageModalTitle').innerText = 'Nueva Página';
        form.reset();
        document.getElementById('pageId').value = '';
    }
    modal.showModal();
};

window.openPreview = (id) => {
    const db = getDB();
    const page = db.pages.find(p => p.id === id);
    
    document.getElementById('previewTitle').innerText = page.title;
    document.getElementById('previewUrl').innerText = `misitio.com${page.slug}`;
    document.getElementById('previewModal').showModal();
};

// --- 6. Módulo: Usuarios (Versión Robusta con Fallbacks) ---
const renderUsers = () => {
    titleContainer.innerText = 'Gestión de Usuarios';
    const db = getDB();
    
    // Manejo seguro de la sesión
    const session = JSON.parse(localStorage.getItem('cms_session')) || {};
    const isAdmin = session.role === 'Admin';
    
    try {
        let html = `
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl text-white font-bold">Cuentas y Perfiles</h2>
                ${isAdmin ? `
                <button onclick="openUserModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-base font-medium">
                    + Nuevo Usuario
                </button>` : `<span class="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-base text-white font-semibold">Privilegios limitados (Solo lectura)</span>`}
            </div>
            <div class="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-sm">
                <table class="w-full text-left text-base text-white">
                    <thead class="bg-slate-900 border-b border-slate-600 text-white uppercase text-sm font-bold">
                        <tr>
                            <th class="px-6 py-5">Nombre</th>
                            <th class="px-6 py-5">Correo</th>
                            <th class="px-6 py-5">Rol</th>
                            <th class="px-6 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${db.users && db.users.length > 0 ? db.users.map(u => {
                            // Validaciones de seguridad para evitar cuelgues (Fallbacks)
                            const safeName = u.name || 'Usuario Desconocido';
                            const initial = safeName.charAt(0).toUpperCase();
                            const safeEmail = u.email || 'Sin correo';
                            const safeRole = u.role || 'Colaborador';
                            return `
                            <tr class="border-b border-slate-600 hover:bg-slate-700 transition-colors">
                                <td class="px-6 py-5 font-bold text-white flex items-center text-lg">
                                    <div class="w-10 h-10 rounded-full bg-indigo-700 text-white flex items-center justify-center mr-3 font-bold text-lg">
                                        ${initial}
                                    </div>
                                    ${safeName}
                                </td>
                                <td class="px-6 py-5 text-white text-lg">${safeEmail}</td>
                                <td class="px-6 py-5">
                                    <span class="badge-oval ${safeRole === 'Admin' ? 'bg-indigo-700 text-white' : 'bg-slate-600 text-white'}">
                                        ${safeRole}
                                    </span>
                                </td>
                                <td class="px-6 py-5 text-right space-x-3 flex justify-end items-center">
                                    ${isAdmin ? `
                                        <button onclick="openUserModal(${u.id})" class="bg-blue-700 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors">Editar</button>
                                        <button onclick="deleteRecord('users', ${u.id})" class="bg-red-700 text-white px-4 py-2 rounded font-semibold hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-400 transition-colors">Eliminar</button>
                                    ` : `
                                        <span class="badge-oval text-white text-base flex items-center bg-red-700 font-bold" title="Requiere rol Admin" style="gap:0.25em;">
                                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                            Bloqueado
                                        </span>
                                    `}
                                </td>
                            </tr>
                            `;
                        }).join('') : `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No hay usuarios registrados.</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;
        appContainer.innerHTML = html;
    } catch (error) {
        // Interfaz de recuperación de errores (UI UX Heurística)
        console.error("Error al renderizar usuarios:", error);
        appContainer.innerHTML = `
            <div class="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-lg">
                <h3 class="text-lg font-bold text-red-400 mb-2 flex items-center">
                    <span class="mr-2">⚠</span> Error de Integridad de Datos
                </h3>
                <p class="text-sm text-slate-300 mb-4">Se detectó un registro corrupto en la base de datos local que impide cargar este módulo. Esto suele ocurrir durante el desarrollo.</p>
                <button onclick="localStorage.removeItem('cms_data'); window.location.reload();" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors shadow-md">
                    Formatear Base de Datos Local
                </button>
            </div>
        `;
    }
};

window.openUserModal = (id = null) => {
    const db = getDB();
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    
    if (id) {
        const user = db.users.find(u => u.id === id);
        document.getElementById('userModalTitle').innerText = 'Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
    } else {
        document.getElementById('userModalTitle').innerText = 'Nuevo Usuario';
        form.reset();
        document.getElementById('userId').value = '';
    }
    modal.showModal();
};

const renderSections = () => {
    titleContainer.innerText = 'Bloques Modulares';
    appContainer.innerHTML = `<div class="p-8 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">Módulo en construcción...</div>`;
};

// --- 7. Controladores de Formularios y Eliminación Genérica ---
const setupEventListeners = () => {
    // Submit Formulario Páginas
    document.getElementById('pageForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const db = getDB();
        const id = document.getElementById('pageId').value;
        const pageData = {
            id: id ? parseInt(id) : Date.now(),
            title: document.getElementById('pageTitle').value,
            slug: document.getElementById('pageSlug').value,
            status: document.getElementById('pageStatus').value
        };

        if (id) {
            const index = db.pages.findIndex(p => p.id == id);
            db.pages[index] = pageData;
            showToast('Página actualizada');
        } else {
            db.pages.push(pageData);
            showToast('Página creada exitosamente');
        }
        
        saveDB(db);
        closeModal('pageModal');
        renderPages();
    });

    // Submit Formulario Usuarios
    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const db = getDB();
        const id = document.getElementById('userId').value;
        const userData = {
            id: id ? parseInt(id) : Date.now(),
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value
        };

        if (id) {
            const index = db.users.findIndex(u => u.id == id);
            db.users[index] = userData;
            showToast('Usuario actualizado');
        } else {
            db.users.push(userData);
            showToast('Usuario creado exitosamente');
        }
        
        saveDB(db);
        closeModal('userModal');
        renderUsers();
    });
};

// Función genérica para eliminar cualquier registro
window.deleteRecord = (collection, id) => {
    confirmAction(() => {
        const db = getDB();
        db[collection] = db[collection].filter(item => item.id !== id);
        saveDB(db);
        
        if (collection === 'pages') renderPages();
        if (collection === 'users') renderUsers();
        
        showToast('Registro eliminado', 'error');
    });
};